package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Item;
import com.finance.app.repository.ItemRepository;
import com.finance.app.service.criteria.ItemCriteria;
import com.finance.app.service.dto.ItemDTO;
import com.finance.app.service.mapper.ItemMapper;
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
 * Service for executing complex queries for {@link Item} entities in the database.
 * The main input is a {@link ItemCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link ItemDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class ItemQueryService extends QueryService<Item> {

    private static final Logger LOG = LoggerFactory.getLogger(ItemQueryService.class);

    private final ItemRepository itemRepository;

    private final ItemMapper itemMapper;

    public ItemQueryService(ItemRepository itemRepository, ItemMapper itemMapper) {
        this.itemRepository = itemRepository;
        this.itemMapper = itemMapper;
    }

    /**
     * Return a {@link Page} of {@link ItemDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<ItemDTO> findByCriteria(ItemCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Item> specification = createSpecification(criteria);
        return itemRepository.findAll(specification, page).map(itemMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(ItemCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Item> specification = createSpecification(criteria);
        return itemRepository.count(specification);
    }

    /**
     * Function to convert {@link ItemCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Item> createSpecification(ItemCriteria criteria) {
        Specification<Item> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Item_.id),
                buildStringSpecification(criteria.getName(), Item_.name),
                buildStringSpecification(criteria.getSku(), Item_.sku),
                buildStringSpecification(criteria.getType(), Item_.type),
                buildRangeSpecification(criteria.getSellingPrice(), Item_.sellingPrice),
                buildRangeSpecification(criteria.getPurchasePrice(), Item_.purchasePrice),
                buildRangeSpecification(criteria.getTaxPercent(), Item_.taxPercent),
                buildStringSpecification(criteria.getUnit(), Item_.unit),
                buildSpecification(criteria.getActive(), Item_.active),
                buildSpecification(criteria.getDeleted(), Item_.deleted),
                buildStringSpecification(criteria.getDescription(), Item_.description),
                buildRangeSpecification(criteria.getOpeningStock(), Item_.openingStock),
                buildRangeSpecification(criteria.getReorderLevel(), Item_.reorderLevel),
                buildRangeSpecification(criteria.getCreatedAt(), Item_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Item_.updatedAt),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Item_.business, JoinType.LEFT).get(Business_.id))
            );
        }
        return specification;
    }
}
