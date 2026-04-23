package com.finance.app.repository;

import com.finance.app.domain.Account;
import com.finance.app.domain.enumeration.AccountType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Account entity.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {
    default Optional<Account> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Account> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Account> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select account from Account account left join fetch account.business",
        countQuery = "select count(account) from Account account"
    )
    Page<Account> findAllWithToOneRelationships(Pageable pageable);

    @Query("select account from Account account left join fetch account.business")
    List<Account> findAllWithToOneRelationships();

    @Query("select account from Account account left join fetch account.business where account.id =:id")
    Optional<Account> findOneWithToOneRelationships(@Param("id") Long id);

    @Query(
        "select account from Account account where account.business.id = :businessId and account.type = :type and (account.deleted is null or account.deleted = false)"
    )
    Optional<Account> findActiveByBusinessIdAndType(@Param("businessId") Long businessId, @Param("type") AccountType type);
}
