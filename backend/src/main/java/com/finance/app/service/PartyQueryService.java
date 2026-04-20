package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Party;
import com.finance.app.repository.PartyRepository;
import com.finance.app.service.criteria.PartyCriteria;
import com.finance.app.service.dto.PartyDTO;
import com.finance.app.service.mapper.PartyMapper;
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
 * Service for executing complex queries for {@link Party} entities in the database.
 * The main input is a {@link PartyCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link PartyDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class PartyQueryService extends QueryService<Party> {

    private static final Logger LOG = LoggerFactory.getLogger(PartyQueryService.class);

    private final PartyRepository partyRepository;

    private final PartyMapper partyMapper;

    public PartyQueryService(PartyRepository partyRepository, PartyMapper partyMapper) {
        this.partyRepository = partyRepository;
        this.partyMapper = partyMapper;
    }

    /**
     * Return a {@link Page} of {@link PartyDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<PartyDTO> findByCriteria(PartyCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Party> specification = createSpecification(criteria);
        return partyRepository.findAll(specification, page).map(partyMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(PartyCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Party> specification = createSpecification(criteria);
        return partyRepository.count(specification);
    }

    /**
     * Function to convert {@link PartyCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Party> createSpecification(PartyCriteria criteria) {
        Specification<Party> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Party_.id),
                buildStringSpecification(criteria.getName(), Party_.name),
                buildSpecification(criteria.getType(), Party_.type),
                buildStringSpecification(criteria.getMobile(), Party_.mobile),
                buildStringSpecification(criteria.getEmail(), Party_.email),
                buildStringSpecification(criteria.getAddressLine1(), Party_.addressLine1),
                buildStringSpecification(criteria.getAddressCity(), Party_.addressCity),
                buildStringSpecification(criteria.getAddressState(), Party_.addressState),
                buildStringSpecification(criteria.getAddressPincode(), Party_.addressPincode),
                buildStringSpecification(criteria.getGstNumber(), Party_.gstNumber),
                buildStringSpecification(criteria.getPanNumber(), Party_.panNumber),
                buildRangeSpecification(criteria.getCreditLimit(), Party_.creditLimit),
                buildRangeSpecification(criteria.getPaymentTermsDays(), Party_.paymentTermsDays),
                buildRangeSpecification(criteria.getOpeningBalance(), Party_.openingBalance),
                buildRangeSpecification(criteria.getBalance(), Party_.balance),
                buildRangeSpecification(criteria.getCreatedAt(), Party_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Party_.updatedAt),
                buildSpecification(criteria.getDeleted(), Party_.deleted),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Party_.business, JoinType.LEFT).get(Business_.id))
            );
        }
        return specification;
    }
}
