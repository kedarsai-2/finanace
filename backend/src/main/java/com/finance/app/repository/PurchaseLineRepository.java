package com.finance.app.repository;

import com.finance.app.domain.PurchaseLine;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PurchaseLine entity.
 */
@Repository
public interface PurchaseLineRepository extends JpaRepository<PurchaseLine, Long> {
    default Optional<PurchaseLine> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<PurchaseLine> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<PurchaseLine> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select purchaseLine from PurchaseLine purchaseLine left join fetch purchaseLine.item left join fetch purchaseLine.purchase",
        countQuery = "select count(purchaseLine) from PurchaseLine purchaseLine"
    )
    Page<PurchaseLine> findAllWithToOneRelationships(Pageable pageable);

    @Query("select purchaseLine from PurchaseLine purchaseLine left join fetch purchaseLine.item left join fetch purchaseLine.purchase")
    List<PurchaseLine> findAllWithToOneRelationships();

    @Query(
        "select purchaseLine from PurchaseLine purchaseLine left join fetch purchaseLine.item left join fetch purchaseLine.purchase where purchaseLine.id =:id"
    )
    Optional<PurchaseLine> findOneWithToOneRelationships(@Param("id") Long id);

    @Query(
        "select purchaseLine from PurchaseLine purchaseLine left join fetch purchaseLine.item where purchaseLine.purchase.id = :purchaseId order by purchaseLine.lineOrder asc, purchaseLine.id asc"
    )
    List<PurchaseLine> findAllByPurchaseIdWithItem(@Param("purchaseId") Long purchaseId);
}
