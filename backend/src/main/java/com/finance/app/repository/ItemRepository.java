package com.finance.app.repository;

import com.finance.app.domain.Item;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Item entity.
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    default Optional<Item> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Item> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Item> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(value = "select item from Item item left join fetch item.business", countQuery = "select count(item) from Item item")
    Page<Item> findAllWithToOneRelationships(Pageable pageable);

    @Query("select item from Item item left join fetch item.business")
    List<Item> findAllWithToOneRelationships();

    @Query("select item from Item item left join fetch item.business where item.id =:id")
    Optional<Item> findOneWithToOneRelationships(@Param("id") Long id);
}
