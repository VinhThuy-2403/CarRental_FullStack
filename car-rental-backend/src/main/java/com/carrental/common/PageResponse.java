package com.carrental.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    
    private List<T> content;      // Danh sách dữ liệu của trang hiện tại
    private int pageNo;           // Số thứ tự trang (bắt đầu từ 0)
    private int pageSize;         // Số lượng phần tử trên 1 trang
    private long totalElements;   // Tổng số phần tử trên toàn bộ các trang
    private int totalPages;       // Tổng số trang
    private boolean last;         // Cờ đánh dấu có phải trang cuối cùng hay không

    /**
     * Factory method để chuyển đổi trực tiếp từ đối tượng Page của Spring sang PageResponse
     */
    public static <T> PageResponse<T> of(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNo(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}