package com.finance.app.repository;

import com.finance.app.domain.PaymentAllocation;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PaymentAllocation entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {
    @Query("select pa from PaymentAllocation pa join fetch pa.payment p where p.business.id = :businessId")
    List<PaymentAllocation> findAllByBusinessId(@Param("businessId") Long businessId);
}
