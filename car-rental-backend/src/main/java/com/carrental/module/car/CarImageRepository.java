package com.carrental.module.car;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarImageRepository extends JpaRepository<CarImage, Long> {

    Optional<CarImage> findByIdAndCarId(Long id, Long carId);

    int countByCar(Car car);
}