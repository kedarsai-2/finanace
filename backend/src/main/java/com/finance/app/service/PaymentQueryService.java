package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Payment;
import com.finance.app.repository.PaymentRepository;
import com.finance.app.service.criteria.PaymentCriteria;
import com.finance.app.service.dto.PaymentDTO;
import com.finance.app.service.mapper.PaymentMapper;
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
 * Service for executing complex queries for {@link Payment} entities in the database.
 * The main input is a {@link PaymentCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link PaymentDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class PaymentQueryService extends QueryService<Payment> {

    private static final Logger LOG = LoggerFactory.getLogger(PaymentQueryService.class);

    private final PaymentRepository paymentRepository;

    private final PaymentMapper paymentMapper;

    public PaymentQueryService(PaymentRepository paymentRepository, PaymentMapper paymentMapper) {
        this.paymentRepository = paymentRepository;
        this.paymentMapper = paymentMapper;
    }

    /**
     * Return a {@link Page} of {@link PaymentDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<PaymentDTO> findByCriteria(PaymentCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Payment> specification = createSpecification(criteria);
        return paymentRepository.findAll(specification, page).map(paymentMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(PaymentCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Payment> specification = createSpecification(criteria);
        return paymentRepository.count(specification);
    }

    /**
     * Function to convert {@link PaymentCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Payment> createSpecification(PaymentCriteria criteria) {
        Specification<Payment> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Payment_.id),
                buildSpecification(criteria.getDirection(), Payment_.direction),
                buildRangeSpecification(criteria.getDate(), Payment_.date),
                buildRangeSpecification(criteria.getAmount(), Payment_.amount),
                buildSpecification(criteria.getMode(), Payment_.mode),
                buildStringSpecification(criteria.getReference(), Payment_.reference),
                buildStringSpecification(criteria.getNotes(), Payment_.notes),
                buildRangeSpecification(criteria.getCreatedAt(), Payment_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Payment_.updatedAt),
                buildSpecification(criteria.getAllocationsId(), root ->
                    root.join(Payment_.allocationses, JoinType.LEFT).get(PaymentAllocation_.id)
                ),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Payment_.business, JoinType.LEFT).get(Business_.id)),
                buildSpecification(criteria.getPartyId(), root -> root.join(Payment_.party, JoinType.LEFT).get(Party_.id)),
                buildSpecification(criteria.getAccountId(), root -> root.join(Payment_.account, JoinType.LEFT).get(Account_.id))
            );
        }
        return specification;
    }
}
