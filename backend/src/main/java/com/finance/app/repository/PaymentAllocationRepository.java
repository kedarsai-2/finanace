package com.finance.app.repository;

import com.finance.app.domain.PaymentAllocation;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PaymentAllocation entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {}
