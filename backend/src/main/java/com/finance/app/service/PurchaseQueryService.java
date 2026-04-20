package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Purchase;
import com.finance.app.repository.PurchaseRepository;
import com.finance.app.service.criteria.PurchaseCriteria;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.service.mapper.PurchaseMapper;
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
 * Service for executing complex queries for {@link Purchase} entities in the database.
 * The main input is a {@link PurchaseCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link PurchaseDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class PurchaseQueryService extends QueryService<Purchase> {

    private static final Logger LOG = LoggerFactory.getLogger(PurchaseQueryService.class);

    private final PurchaseRepository purchaseRepository;

    private final PurchaseMapper purchaseMapper;

    public PurchaseQueryService(PurchaseRepository purchaseRepository, PurchaseMapper purchaseMapper) {
        this.purchaseRepository = purchaseRepository;
        this.purchaseMapper = purchaseMapper;
    }

    /**
     * Return a {@link Page} of {@link PurchaseDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<PurchaseDTO> findByCriteria(PurchaseCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Purchase> specification = createSpecification(criteria);
        return purchaseRepository.findAll(specification, page).map(purchaseMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(PurchaseCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Purchase> specification = createSpecification(criteria);
        return purchaseRepository.count(specification);
    }

    /**
     * Function to convert {@link PurchaseCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Purchase> createSpecification(PurchaseCriteria criteria) {
        Specification<Purchase> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Purchase_.id),
                buildStringSpecification(criteria.getNumber(), Purchase_.number),
                buildRangeSpecification(criteria.getDate(), Purchase_.date),
                buildRangeSpecification(criteria.getDueDate(), Purchase_.dueDate),
                buildStringSpecification(criteria.getPartyName(), Purchase_.partyName),
                buildStringSpecification(criteria.getPartyState(), Purchase_.partyState),
                buildStringSpecification(criteria.getBusinessState(), Purchase_.businessState),
                buildRangeSpecification(criteria.getSubtotal(), Purchase_.subtotal),
                buildRangeSpecification(criteria.getItemDiscountTotal(), Purchase_.itemDiscountTotal),
                buildSpecification(criteria.getOverallDiscountKind(), Purchase_.overallDiscountKind),
                buildRangeSpecification(criteria.getOverallDiscountValue(), Purchase_.overallDiscountValue),
                buildRangeSpecification(criteria.getOverallDiscountAmount(), Purchase_.overallDiscountAmount),
                buildRangeSpecification(criteria.getTaxableValue(), Purchase_.taxableValue),
                buildRangeSpecification(criteria.getCgst(), Purchase_.cgst),
                buildRangeSpecification(criteria.getSgst(), Purchase_.sgst),
                buildRangeSpecification(criteria.getIgst(), Purchase_.igst),
                buildRangeSpecification(criteria.getTaxTotal(), Purchase_.taxTotal),
                buildRangeSpecification(criteria.getTotal(), Purchase_.total),
                buildRangeSpecification(criteria.getPaidAmount(), Purchase_.paidAmount),
                buildSpecification(criteria.getStatus(), Purchase_.status),
                buildStringSpecification(criteria.getNotes(), Purchase_.notes),
                buildStringSpecification(criteria.getTerms(), Purchase_.terms),
                buildRangeSpecification(criteria.getFinalizedAt(), Purchase_.finalizedAt),
                buildSpecification(criteria.getDeleted(), Purchase_.deleted),
                buildRangeSpecification(criteria.getCreatedAt(), Purchase_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Purchase_.updatedAt),
                buildSpecification(criteria.getLinesId(), root -> root.join(Purchase_.lineses, JoinType.LEFT).get(PurchaseLine_.id)),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Purchase_.business, JoinType.LEFT).get(Business_.id)),
                buildSpecification(criteria.getPartyId(), root -> root.join(Purchase_.party, JoinType.LEFT).get(Party_.id))
            );
        }
        return specification;
    }
}
