package com.carrental.module.car;

import com.carrental.common.ApiResponse;
import com.carrental.module.car.dto.CarDtos.*;
import com.carrental.module.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    // ─── Public endpoints ────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CarSummary>>> search(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer seats,
            @RequestParam(required = false) String transmission,
            @RequestParam(required = false) String fuelType,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size) {

        CarSearchRequest req = new CarSearchRequest();
        req.setProvince(province);
        req.setStartDate(startDate);
        req.setEndDate(endDate);
        req.setMinPrice(minPrice);
        req.setMaxPrice(maxPrice);
        req.setSeats(seats);
        req.setSortBy(sortBy);
        if (transmission != null) {
            try { req.setTransmission(
                    com.carrental.common.enums.Transmission.valueOf(transmission.toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (fuelType != null) {
            try { req.setFuelType(
                    com.carrental.common.enums.FuelType.valueOf(fuelType.toUpperCase()));
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(ApiResponse.ok(carService.searchCars(req, page, size)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<CarSummary>>> featured(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(carService.getFeaturedCars(limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CarDetail>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(carService.getCarDetail(id)));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<CalendarDay>>> getAvailability(
            @PathVariable Long id,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().year}")   int year,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().monthValue}") int month) {
        return ResponseEntity.ok(ApiResponse.ok(carService.getAvailability(id, year, month)));
    }

    // ─── Host endpoints ──────────────────────────────────

    @GetMapping("/my-cars")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<List<CarSummary>>> getMyCars(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(carService.getMyCars(user)));
    }

    @GetMapping("/my-cars/{id}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<CarDetail>> getMyCarDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(carService.getMyCarDetail(id, user)));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<CarDetail>> create(
            @Valid @RequestBody CarRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(carService.createCar(request, user),
                        "Đăng xe thành công! Vui lòng chờ Admin duyệt."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<CarDetail>> update(
            @PathVariable Long id,
            @Valid @RequestBody CarRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                carService.updateCar(id, request, user), "Cập nhật xe thành công"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal User user) {
        carService.updateCarStatus(id, request.getStatus(), user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật trạng thái thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        carService.deleteCar(id, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa xe thành công"));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<CarDetail>> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                carService.uploadImages(id, files, user), "Upload ảnh thành công"));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @AuthenticationPrincipal User user) {
        carService.deleteImage(id, imageId, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa ảnh thành công"));
    }
}