package com.carrental.module.car;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "car_images")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false, length = 200)
    private String publicId; // Cloudinary public_id để xóa

    @Builder.Default
    private boolean isPrimary = false;

    @Builder.Default
    private int displayOrder = 0;
}