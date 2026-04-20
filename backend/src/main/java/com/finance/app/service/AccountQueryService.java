package com.finance.app.service;

import com.finance.app.domain.*; // for static metamodels
import com.finance.app.domain.Account;
import com.finance.app.repository.AccountRepository;
import com.finance.app.service.criteria.AccountCriteria;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.mapper.AccountMapper;
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
 * Service for executing complex queries for {@link Account} entities in the database.
 * The main input is a {@link AccountCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link AccountDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class AccountQueryService extends QueryService<Account> {

    private static final Logger LOG = LoggerFactory.getLogger(AccountQueryService.class);

    private final AccountRepository accountRepository;

    private final AccountMapper accountMapper;

    public AccountQueryService(AccountRepository accountRepository, AccountMapper accountMapper) {
        this.accountRepository = accountRepository;
        this.accountMapper = accountMapper;
    }

    /**
     * Return a {@link Page} of {@link AccountDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<AccountDTO> findByCriteria(AccountCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Account> specification = createSpecification(criteria);
        return accountRepository.findAll(specification, page).map(accountMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(AccountCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Account> specification = createSpecification(criteria);
        return accountRepository.count(specification);
    }

    /**
     * Function to convert {@link AccountCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Account> createSpecification(AccountCriteria criteria) {
        Specification<Account> specification = Specification.unrestricted();
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : Specification.unrestricted(),
                buildRangeSpecification(criteria.getId(), Account_.id),
                buildStringSpecification(criteria.getName(), Account_.name),
                buildSpecification(criteria.getType(), Account_.type),
                buildRangeSpecification(criteria.getOpeningBalance(), Account_.openingBalance),
                buildStringSpecification(criteria.getAccountNumber(), Account_.accountNumber),
                buildStringSpecification(criteria.getIfsc(), Account_.ifsc),
                buildStringSpecification(criteria.getUpiId(), Account_.upiId),
                buildStringSpecification(criteria.getNotes(), Account_.notes),
                buildSpecification(criteria.getDeleted(), Account_.deleted),
                buildRangeSpecification(criteria.getCreatedAt(), Account_.createdAt),
                buildRangeSpecification(criteria.getUpdatedAt(), Account_.updatedAt),
                buildSpecification(criteria.getBusinessId(), root -> root.join(Account_.business, JoinType.LEFT).get(Business_.id))
            );
        }
        return specification;
    }
}
