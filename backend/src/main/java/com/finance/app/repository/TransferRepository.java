package com.finance.app.repository;

import com.finance.app.domain.Transfer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Transfer entity.
 */
@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long>, JpaSpecificationExecutor<Transfer> {
    default Optional<Transfer> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Transfer> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Transfer> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select transfer from Transfer transfer left join fetch transfer.business left join fetch transfer.fromAccount left join fetch transfer.toAccount",
        countQuery = "select count(transfer) from Transfer transfer"
    )
    Page<Transfer> findAllWithToOneRelationships(Pageable pageable);

    @Query(
        "select transfer from Transfer transfer left join fetch transfer.business left join fetch transfer.fromAccount left join fetch transfer.toAccount"
    )
    List<Transfer> findAllWithToOneRelationships();

    @Query(
        "select transfer from Transfer transfer left join fetch transfer.business left join fetch transfer.fromAccount left join fetch transfer.toAccount where transfer.id =:id"
    )
    Optional<Transfer> findOneWithToOneRelationships(@Param("id") Long id);
}
