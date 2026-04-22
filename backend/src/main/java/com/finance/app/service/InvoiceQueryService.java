package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Invoice;
import com.finance.app.repository.InvoiceRepository;
import com.finance.app.service.criteria.InvoiceCriteria;
import com.finance.app.service.dto.InvoiceDTO;
import com.finance.app.service.mapper.InvoiceMapper;
import jakarta.persistence.criteria.JoinType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.jhipster.service.QueryService;

/**
 * Service for executing complex queries for {@link Invoice} entities in the database.
 * The main input is a {@link InvoiceCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link InvoiceDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class InvoiceQueryService extends QueryService<Invoice> {

    private static final Logger LOG = LoggerFactory.getLogger(InvoiceQueryService.class);

    private final InvoiceRepository invoiceRepository;

    private final InvoiceMapper invoiceMapper;

    public InvoiceQueryService(InvoiceRepository invoiceRepository, InvoiceMapper invoiceMapper) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceMapper = invoiceMapper;
    }

    /**
     * Return a {@link Page} of {@link InvoiceDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<InvoiceDTO> findByCriteria(InvoiceCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Invoice> specification = createSpecification(criteria);
        return invoiceRepository.findAll(specification, page).map(invoiceMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(InvoiceCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Invoice> specification = createSpecification(criteria);
        return invoiceRepository.count(specification);
    }

    /**
     * Function to convert {@link InvoiceCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Invoice> createSpecification(InvoiceCriteria criteria) {
        Specification<Invoice> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Invoice_.id),
                buildStringSpecification(criteria.getNumber(), Invoice_.number),
                buildRangeSpecification(criteria.getDate(), Invoice_.date),
                buildRangeSpecification(criteria.getDueDate(), Invoice_.dueDate),
                buildRangeSpecification(criteria.getPaymentTermsDays(), Invoice_.paymentTermsDays),
                buildStringSpecification(criteria.getPartyName(), Invoice_.partyName),
                buildStringSpecification(criteria.getPartyState(), Invoice_.partyState),
                buildStringSpecification(criteria.getBusinessState(), Invoice_.businessState),
                buildRangeSpecification(criteria.getSubtotal(), Invoice_.subtotal),
                buildRangeSpecification(criteria.getItemDiscountTotal(), Invoice_.itemDiscountTotal),
                buildSpecification(criteria.getOverallDiscountKind(), Invoice_.overallDiscountKind),
                buildRangeSpecification(criteria.getOverallDiscountValue(), Invoice_.overallDiscountValue),
                buildRangeSpecification(criteria.getOverallDiscountAmount(), Invoice_.overallDiscountAmount),
                buildRangeSpecification(criteria.getTaxableValue(), Invoice_.taxableValue),
                buildRangeSpecification(criteria.getCgst(), Invoice_.cgst),
                buildRangeSpecification(criteria.getSgst(), Invoice_.sgst),
                buildRangeSpecification(criteria.getIgst(), Invoice_.igst),
                buildRangeSpecification(criteria.getTaxTotal(), Invoice_.taxTotal),
                buildRangeSpecification(criteria.getTotal(), Invoice_.total),
                buildRangeSpecification(criteria.getPaidAmount(), Invoice_.paidAmount),
                buildSpecification(criteria.getStatus(), Invoice_.status),
                buildSpecification(criteria.getKind(), Invoice_.kind),
                buildRangeSpecification(criteria.getSourceInvoiceId(), Invoice_.sourceInvoiceId),
                buildStringSpecification(criteria.getNotes(), Invoice_.notes),
                buildStringSpecification(criteria.getTerms(), Invoice_.terms),
                buildRangeSpecification(criteria.getFinalizedAt(), Invoice_.finalizedAt),
                buildSpecification(criteria.getDeleted(), Invoice_.deleted),
                buildRangeSpecification(criteria.getCreatedAt(), Invoice_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Invoice_.updatedAt),
                buildSpecification(criteria.getLinesId(), root -> root.join(Invoice_.lineses, JoinType.LEFT).get(InvoiceLine_.id)),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Invoice_.business, JoinType.LEFT).get(Business_.id)),
                buildSpecification(criteria.getPartyId(), root -> root.join(Invoice_.party, JoinType.LEFT).get(Party_.id))
            );
        }
        return specification;
    }
}
