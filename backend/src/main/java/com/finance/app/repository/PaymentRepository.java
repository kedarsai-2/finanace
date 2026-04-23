package com.finance.app.repository;

import com.finance.app.domain.Payment;
import com.finance.app.domain.enumeration.PaymentDirection;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Payment entity.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {
    default Optional<Payment> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Payment> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Payment> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select payment from Payment payment left join fetch payment.business left join fetch payment.party left join fetch payment.account",
        countQuery = "select count(payment) from Payment payment"
    )
    Page<Payment> findAllWithToOneRelationships(Pageable pageable);

    @Query(
        "select payment from Payment payment left join fetch payment.business left join fetch payment.party left join fetch payment.account"
    )
    List<Payment> findAllWithToOneRelationships();

    @Query(
        "select payment from Payment payment left join fetch payment.business left join fetch payment.party left join fetch payment.account where payment.id =:id"
    )
    Optional<Payment> findOneWithToOneRelationships(@Param("id") Long id);

    @Query(
        "select coalesce(sum(case when payment.direction = :inDir then payment.amount else -payment.amount end), 0) from Payment payment where payment.account.id = :accountId"
    )
    BigDecimal sumSignedAmountByAccountId(@Param("accountId") Long accountId, @Param("inDir") PaymentDirection inDir);
}
