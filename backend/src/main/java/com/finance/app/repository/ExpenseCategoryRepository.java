package com.finance.app.repository;

import com.finance.app.domain.ExpenseCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ExpenseCategory entity.
 */
@Repository
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    default Optional<ExpenseCategory> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<ExpenseCategory> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<ExpenseCategory> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select expenseCategory from ExpenseCategory expenseCategory left join fetch expenseCategory.business",
        countQuery = "select count(expenseCategory) from ExpenseCategory expenseCategory"
    )
    Page<ExpenseCategory> findAllWithToOneRelationships(Pageable pageable);

    @Query("select expenseCategory from ExpenseCategory expenseCategory left join fetch expenseCategory.business")
    List<ExpenseCategory> findAllWithToOneRelationships();

    @Query(
        "select expenseCategory from ExpenseCategory expenseCategory left join fetch expenseCategory.business where expenseCategory.id =:id"
    )
    Optional<ExpenseCategory> findOneWithToOneRelationships(@Param("id") Long id);
}
