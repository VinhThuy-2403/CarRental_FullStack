package com.carrental.module.car;

import com.carrental.common.enums.CarStatus;
import com.carrental.common.enums.FuelType;
import com.carrental.common.enums.Transmission;
import com.carrental.module.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cars")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false, unique = true, length = 20)
    private String licensePlate;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer seats;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FuelType fuelType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Transmission transmission;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deposit;

    @Builder.Default
    private Integer kmLimitPerDay = 300;

    @Column(nullable = false, length = 100)
    private String province;

    @Column(length = 100)
    private String district;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CarStatus status = CarStatus.PENDING;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Builder.Default
    private Integer totalReviews = 0;

    // Lý do từ chối (Admin điền)
    @Column(columnDefinition = "TEXT")
    private String rejectReason;

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarImage> images = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "car_features", joinColumns = @JoinColumn(name = "car_id"))
    @Column(name = "feature_name")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper: tên đầy đủ
    public String getFullName() {
        return brand + " " + model + " " + year;
    }

    // Ảnh chính
    public String getPrimaryImageUrl() {
        return images.stream()
                .filter(CarImage::isPrimary)
                .findFirst()
                .map(CarImage::getUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getUrl());
    }
}