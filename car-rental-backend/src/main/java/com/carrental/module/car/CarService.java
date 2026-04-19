package com.carrental.module.car;

import com.carrental.common.enums.CalendarStatus;
import com.carrental.common.enums.CarStatus;
import com.carrental.common.exception.AppException;
import com.carrental.module.car.dto.CarDtos.*;
import com.carrental.module.user.User;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final CarImageRepository carImageRepository;
    private final CarCalendarRepository calendarRepository;
    private final Cloudinary cloudinary;

    // ─── Public: Tìm kiếm xe ─────────────────────────────

    public Page<CarSummary> searchCars(CarSearchRequest req, int page, int size) {
        Sort sort = switch (Optional.ofNullable(req.getSortBy()).orElse("newest")) {
            case "price_asc"  -> Sort.by("pricePerDay").ascending();
            case "price_desc" -> Sort.by("pricePerDay").descending();
            case "rating"     -> Sort.by("avgRating").descending();
            default           -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Car> cars = carRepository.searchCars(
                req.getProvince(),
                req.getStartDate(),
                req.getEndDate(),
                req.getMinPrice(),
                req.getMaxPrice(),
                req.getSeats(),
                req.getTransmission(),
                req.getFuelType(),
                pageable
        );
        return cars.map(this::toSummary);
    }

    public List<CarSummary> getFeaturedCars(int limit) {
        return carRepository.findFeaturedCars(PageRequest.of(0, limit))
                .stream().map(this::toSummary).toList();
    }

    public CarDetail getCarDetail(Long id) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));
        if (car.getStatus() != CarStatus.APPROVED) {
            throw AppException.notFound("Xe không khả dụng");
        }
        return toDetail(car);
    }

    public List<CalendarDay> getAvailability(Long carId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        // Lấy các ngày đã có trạng thái đặc biệt
        Map<LocalDate, CarCalendar> calMap = new HashMap<>();
        calendarRepository.findByCarIdAndDateBetweenOrderByDate(carId, start, end)
                .forEach(c -> calMap.put(c.getDate(), c));

        // Build danh sách đầy đủ các ngày trong tháng
        List<CalendarDay> result = new ArrayList<>();
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            CalendarDay day = new CalendarDay();
            day.setDate(cursor);
            if (calMap.containsKey(cursor)) {
                CarCalendar cal = calMap.get(cursor);
                day.setStatus(cal.getStatus());
                day.setBookingId(cal.getBookingId());
            } else {
                day.setStatus(CalendarStatus.AVAILABLE);
            }
            result.add(day);
            cursor = cursor.plusDays(1);
        }
        return result;
    }

    // ─── Host: Quản lý xe ────────────────────────────────

    public List<CarSummary> getMyCars(User host) {
        return carRepository.findByHostOrderByCreatedAtDesc(host)
                .stream().map(this::toSummary).toList();
    }

    public CarDetail getMyCarDetail(Long id, User host) {
        Car car = carRepository.findByIdAndHost(id, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));
        return toDetail(car);
    }

    @Transactional
    public CarDetail createCar(CarRequest req, User host) {
        if (carRepository.existsByLicensePlate(req.getLicensePlate())) {
            throw AppException.conflict("Biển số xe đã tồn tại trong hệ thống");
        }

        Car car = Car.builder()
                .host(host)
                .licensePlate(req.getLicensePlate().toUpperCase().trim())
                .brand(req.getBrand())
                .model(req.getModel())
                .year(req.getYear())
                .seats(req.getSeats())
                .fuelType(req.getFuelType())
                .transmission(req.getTransmission())
                .pricePerDay(req.getPricePerDay())
                .deposit(req.getDeposit())
                .kmLimitPerDay(req.getKmLimitPerDay() != null ? req.getKmLimitPerDay() : 300)
                .province(req.getProvince())
                .district(req.getDistrict())
                .description(req.getDescription())
                .features(req.getFeatures() != null ? req.getFeatures() : new ArrayList<>())
                .status(CarStatus.PENDING)
                .build();

        carRepository.save(car);
        log.info("Host {} created car: {}", host.getEmail(), car.getLicensePlate());
        return toDetail(car);
    }

    @Transactional
    public CarDetail updateCar(Long id, CarRequest req, User host) {
        Car car = carRepository.findByIdAndHost(id, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe hoặc bạn không có quyền sửa"));

        // Nếu đổi biển số, kiểm tra trùng
        if (!car.getLicensePlate().equalsIgnoreCase(req.getLicensePlate()) &&
            carRepository.existsByLicensePlate(req.getLicensePlate())) {
            throw AppException.conflict("Biển số xe đã tồn tại");
        }

        car.setLicensePlate(req.getLicensePlate().toUpperCase().trim());
        car.setBrand(req.getBrand());
        car.setModel(req.getModel());
        car.setYear(req.getYear());
        car.setSeats(req.getSeats());
        car.setFuelType(req.getFuelType());
        car.setTransmission(req.getTransmission());
        car.setPricePerDay(req.getPricePerDay());
        car.setDeposit(req.getDeposit());
        car.setKmLimitPerDay(req.getKmLimitPerDay() != null ? req.getKmLimitPerDay() : 300);
        car.setProvince(req.getProvince());
        car.setDistrict(req.getDistrict());
        car.setDescription(req.getDescription());
        car.setFeatures(req.getFeatures() != null ? req.getFeatures() : new ArrayList<>());

        // Khi sửa, xe về PENDING để admin duyệt lại
        if (car.getStatus() == CarStatus.APPROVED) {
            car.setStatus(CarStatus.PENDING);
        }

        carRepository.save(car);
        return toDetail(car);
    }

    @Transactional
    public void updateCarStatus(Long id, CarStatus newStatus, User host) {
        Car car = carRepository.findByIdAndHost(id, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        // Host chỉ được đổi giữa APPROVED ↔ INACTIVE
        if (newStatus != CarStatus.INACTIVE && newStatus != CarStatus.APPROVED) {
            throw AppException.badRequest("Trạng thái không hợp lệ");
        }
        if (newStatus == CarStatus.APPROVED && car.getStatus() == CarStatus.REJECTED) {
            throw AppException.badRequest("Xe bị từ chối không thể tự kích hoạt. Vui lòng chỉnh sửa và đăng lại.");
        }
        car.setStatus(newStatus);
        carRepository.save(car);
    }

    @Transactional
    public void deleteCar(Long id, User host) {
        Car car = carRepository.findByIdAndHost(id, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        // Xóa ảnh trên Cloudinary
        car.getImages().forEach(img -> deleteFromCloudinary(img.getPublicId()));

        carRepository.delete(car);
        log.info("Host {} deleted car {}", host.getEmail(), id);
    }

    // ─── Host: Upload ảnh ────────────────────────────────

    @Transactional
    public CarDetail uploadImages(Long carId, MultipartFile[] files, User host) {
        Car car = carRepository.findByIdAndHost(carId, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        int currentCount = carImageRepository.countByCar(car);
        if (currentCount + files.length > 10) {
            throw AppException.badRequest("Tối đa 10 ảnh mỗi xe (hiện có " + currentCount + ")");
        }

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            try {
                String publicId = "carrental/cars/car_" + carId + "_" + System.currentTimeMillis() + "_" + i;
                Map uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "public_id",     publicId,
                                "overwrite",     true,
                                "resource_type", "image",
                                "transformation","w_1200,h_800,c_fill,q_auto"
                        )
                );

                CarImage image = CarImage.builder()
                        .car(car)
                        .url((String) uploadResult.get("secure_url"))
                        .publicId(publicId)
                        .isPrimary(currentCount == 0 && i == 0) // ảnh đầu tiên là primary
                        .displayOrder(currentCount + i)
                        .build();

                carImageRepository.save(image);
            } catch (IOException e) {
                log.error("Upload image failed for car {}: {}", carId, e.getMessage());
                throw AppException.badRequest("Upload ảnh thất bại: " + file.getOriginalFilename());
            }
        }

        // Reload car để lấy images mới
        car = carRepository.findById(carId).orElseThrow();
        return toDetail(car);
    }

    @Transactional
    public void deleteImage(Long carId, Long imageId, User host) {
        carRepository.findByIdAndHost(carId, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        CarImage image = carImageRepository.findByIdAndCarId(imageId, carId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy ảnh"));

        deleteFromCloudinary(image.getPublicId());
        carImageRepository.delete(image);
    }

    // ─── Host: Quản lý lịch ──────────────────────────────

    public List<CalendarDay> getHostCalendar(Long carId, int year, int month, User host) {
        carRepository.findByIdAndHost(carId, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));
        return getAvailability(carId, year, month);
    }

    @Transactional
    public void blockDates(Long carId, BlockDateRequest req, User host) {
        Car car = carRepository.findByIdAndHost(carId, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        if (req.getStartDate().isAfter(req.getEndDate())) {
            throw AppException.badRequest("Ngày bắt đầu phải trước ngày kết thúc");
        }

        LocalDate cursor = req.getStartDate();
        while (!cursor.isAfter(req.getEndDate())) {
            LocalDate date = cursor;
            boolean isBooked = calendarRepository.existsByCarIdAndDateAndStatusIn(
                    carId, date, List.of(CalendarStatus.BOOKED));
            if (isBooked) {
                throw AppException.badRequest("Ngày " + date + " đã có đơn đặt, không thể chặn");
            }

            calendarRepository.findByCarIdAndDate(carId, date).ifPresentOrElse(
                    cal -> {
                        cal.setStatus(CalendarStatus.BLOCKED);
                        calendarRepository.save(cal);
                    },
                    () -> calendarRepository.save(CarCalendar.builder()
                            .car(car)
                            .date(date)
                            .status(CalendarStatus.BLOCKED)
                            .build())
            );
            cursor = cursor.plusDays(1);
        }
    }

    @Transactional
    public void unblockDates(Long carId, BlockDateRequest req, User host) {
        carRepository.findByIdAndHost(carId, host)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        calendarRepository.deleteBlockedByCarAndDateRange(
                carId, req.getStartDate(), req.getEndDate());
    }

    // ─── Mapper helpers ──────────────────────────────────

    public CarSummary toSummary(Car car) {
        CarSummary s = new CarSummary();
        s.setId(car.getId());
        s.setBrand(car.getBrand());
        s.setModel(car.getModel());
        s.setYear(car.getYear());
        s.setFullName(car.getFullName());
        s.setSeats(car.getSeats());
        s.setFuelType(car.getFuelType());
        s.setTransmission(car.getTransmission());
        s.setPricePerDay(car.getPricePerDay());
        s.setDeposit(car.getDeposit());
        s.setProvince(car.getProvince());
        s.setDistrict(car.getDistrict());
        s.setPrimaryImageUrl(car.getPrimaryImageUrl());
        s.setAvgRating(car.getAvgRating());
        s.setTotalReviews(car.getTotalReviews());
        s.setStatus(car.getStatus());
        s.setCreatedAt(car.getCreatedAt());
        return s;
    }

    public CarDetail toDetail(Car car) {
        CarDetail d = new CarDetail();
        d.setId(car.getId());
        d.setBrand(car.getBrand());
        d.setModel(car.getModel());
        d.setYear(car.getYear());
        d.setFullName(car.getFullName());
        d.setSeats(car.getSeats());
        d.setFuelType(car.getFuelType());
        d.setTransmission(car.getTransmission());
        d.setPricePerDay(car.getPricePerDay());
        d.setDeposit(car.getDeposit());
        d.setKmLimitPerDay(car.getKmLimitPerDay());
        d.setProvince(car.getProvince());
        d.setDistrict(car.getDistrict());
        d.setDescription(car.getDescription());
        d.setFeatures(car.getFeatures());
        d.setAvgRating(car.getAvgRating());
        d.setTotalReviews(car.getTotalReviews());
        d.setStatus(car.getStatus());
        d.setRejectReason(car.getRejectReason());
        d.setCreatedAt(car.getCreatedAt());

        // Images
        d.setImages(car.getImages().stream()
                .sorted(Comparator.comparingInt(CarImage::getDisplayOrder))
                .map(img -> {
                    ImageDto imgDto = new ImageDto();
                    imgDto.setId(img.getId());
                    imgDto.setUrl(img.getUrl());
                    imgDto.setPrimary(img.isPrimary());
                    imgDto.setDisplayOrder(img.getDisplayOrder());
                    return imgDto;
                }).toList());

        // Host info
        User host = car.getHost();
        HostInfo hi = new HostInfo();
        hi.setId(host.getId());
        hi.setFullName(host.getFullName());
        hi.setAvatarUrl(host.getAvatarUrl());
        hi.setAvgRating(0); // sẽ tính từ review service ở phase sau
        hi.setTotalCompletedBookings(0);
        d.setHost(hi);

        return d;
    }

    private void deleteFromCloudinary(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Failed to delete from Cloudinary: {}", publicId);
        }
    }
}