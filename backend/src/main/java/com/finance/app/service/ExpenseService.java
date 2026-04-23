package com.finance.app.service;

import com.finance.app.domain.Expense;
import com.finance.app.domain.enumeration.PaymentMode;
import com.finance.app.repository.ExpenseRepository;
import com.finance.app.service.dto.ExpenseDTO;
import com.finance.app.service.mapper.ExpenseMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.Expense}.
 */
@Service
@Transactional
public class ExpenseService {

    private static final Logger LOG = LoggerFactory.getLogger(ExpenseService.class);

    private final ExpenseRepository expenseRepository;

    private final ExpenseMapper expenseMapper;

    private final CashLedgerAccountService cashLedgerAccountService;

    public ExpenseService(ExpenseRepository expenseRepository, ExpenseMapper expenseMapper, CashLedgerAccountService cashLedgerAccountService) {
        this.expenseRepository = expenseRepository;
        this.expenseMapper = expenseMapper;
        this.cashLedgerAccountService = cashLedgerAccountService;
    }

    /**
     * Save a expense.
     *
     * @param expenseDTO the entity to save.
     * @return the persisted entity.
     */
    public ExpenseDTO save(ExpenseDTO expenseDTO) {
        LOG.debug("Request to save Expense : {}", expenseDTO);
        Expense expense = expenseMapper.toEntity(expenseDTO);
        if (expense.getMode() == PaymentMode.CASH && expense.getAccount() == null && expense.getBusiness() != null) {
            expense.setAccount(cashLedgerAccountService.getOrCreateCashAccount(expense.getBusiness().getId()));
        }
        expense = expenseRepository.save(expense);
        return expenseMapper.toDto(expense);
    }

    /**
     * Update a expense.
     *
     * @param expenseDTO the entity to save.
     * @return the persisted entity.
     */
    public ExpenseDTO update(ExpenseDTO expenseDTO) {
        LOG.debug("Request to update Expense : {}", expenseDTO);
        Expense expense = expenseMapper.toEntity(expenseDTO);
        if (expense.getMode() == PaymentMode.CASH && expense.getAccount() == null && expense.getBusiness() != null) {
            expense.setAccount(cashLedgerAccountService.getOrCreateCashAccount(expense.getBusiness().getId()));
        }
        expense = expenseRepository.save(expense);
        return expenseMapper.toDto(expense);
    }

    /**
     * Partially update a expense.
     *
     * @param expenseDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ExpenseDTO> partialUpdate(ExpenseDTO expenseDTO) {
        LOG.debug("Request to partially update Expense : {}", expenseDTO);

        return expenseRepository
            .findById(expenseDTO.getId())
            .map(existingExpense -> {
                expenseMapper.partialUpdate(existingExpense, expenseDTO);
                if (
                    existingExpense.getMode() == PaymentMode.CASH &&
                    existingExpense.getAccount() == null &&
                    existingExpense.getBusiness() != null
                ) {
                    existingExpense.setAccount(cashLedgerAccountService.getOrCreateCashAccount(existingExpense.getBusiness().getId()));
                }

                return existingExpense;
            })
            .map(expenseRepository::save)
            .map(expenseMapper::toDto);
    }

    /**
     * Get all the expenses with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<ExpenseDTO> findAllWithEagerRelationships(Pageable pageable) {
        return expenseRepository.findAllWithEagerRelationships(pageable).map(expenseMapper::toDto);
    }

    /**
     * Get one expense by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ExpenseDTO> findOne(Long id) {
        LOG.debug("Request to get Expense : {}", id);
        return expenseRepository.findOneWithEagerRelationships(id).map(expenseMapper::toDto);
    }

    /**
     * Delete the expense by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Expense : {}", id);
        expenseRepository.deleteById(id);
    }
}
