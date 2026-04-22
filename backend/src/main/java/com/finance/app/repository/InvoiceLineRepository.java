package com.finance.app.repository;

import com.finance.app.domain.InvoiceLine;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the InvoiceLine entity.
 */
@Repository
public interface InvoiceLineRepository extends JpaRepository<InvoiceLine, Long> {
    default Optional<InvoiceLine> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<InvoiceLine> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<InvoiceLine> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select invoiceLine from InvoiceLine invoiceLine left join fetch invoiceLine.item left join fetch invoiceLine.invoice",
        countQuery = "select count(invoiceLine) from InvoiceLine invoiceLine"
    )
    Page<InvoiceLine> findAllWithToOneRelationships(Pageable pageable);

    @Query("select invoiceLine from InvoiceLine invoiceLine left join fetch invoiceLine.item left join fetch invoiceLine.invoice")
    List<InvoiceLine> findAllWithToOneRelationships();

    @Query(
        "select invoiceLine from InvoiceLine invoiceLine left join fetch invoiceLine.item left join fetch invoiceLine.invoice where invoiceLine.id =:id"
    )
    Optional<InvoiceLine> findOneWithToOneRelationships(@Param("id") Long id);

    @Query(
        "select invoiceLine from InvoiceLine invoiceLine left join fetch invoiceLine.item where invoiceLine.invoice.id = :invoiceId order by invoiceLine.lineOrder asc, invoiceLine.id asc"
    )
    List<InvoiceLine> findAllByInvoiceIdWithItem(@Param("invoiceId") Long invoiceId);
}
