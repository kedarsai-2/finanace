package com.finance.app.repository;

import com.finance.app.domain.Purchase;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Purchase entity.
 */
@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long>, JpaSpecificationExecutor<Purchase> {
    default Optional<Purchase> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Purchase> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Purchase> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select purchase from Purchase purchase left join fetch purchase.business left join fetch purchase.party",
        countQuery = "select count(purchase) from Purchase purchase"
    )
    Page<Purchase> findAllWithToOneRelationships(Pageable pageable);

    @Query("select purchase from Purchase purchase left join fetch purchase.business left join fetch purchase.party")
    List<Purchase> findAllWithToOneRelationships();

    @Query("select purchase from Purchase purchase left join fetch purchase.business left join fetch purchase.party where purchase.id =:id")
    Optional<Purchase> findOneWithToOneRelationships(@Param("id") Long id);
}
