package com.example.library.service;
import com.example.library.dto.LoanCreateRequest;
public final class BorrowingPolicy {
 public static final String VERSION="2026-11-06-v1";
 public static final long OVERDUE_PER_COPY_PER_DAY=10000L;
 public static final long DAMAGED_PER_COPY=50000L;
 private BorrowingPolicy(){}
 public static void requireAcceptance(LoanCreateRequest request){if(!request.isPolicyAccepted()||!VERSION.equals(request.getPolicyVersion()))throw new IllegalArgumentException("Vui lòng đọc và đồng ý quy định mượn/trả sách hiện tại trước khi xác nhận.");}
}
