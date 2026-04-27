package com.finance.app.service;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.enumeration.AccountType;
import com.finance.app.repository.AccountRepository;
import com.finance.app.repository.BusinessRepository;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CashLedgerAccountService {

    private static final String ENTITY_NAME = "cashBalance";

    private final AccountRepository accountRepository;
    private final BusinessRepository businessRepository;

    public CashLedgerAccountService(AccountRepository accountRepository, BusinessRepository businessRepository) {
        this.accountRepository = accountRepository;
        this.businessRepository = businessRepository;
    }

    public Account getOrCreateCashAccount(Long businessId) {
        List<Account> cashAccounts = accountRepository.findAllActiveByBusinessIdAndType(businessId, AccountType.CASH);
        if (cashAccounts.isEmpty()) {
            return createCashAccount(businessId);
        }
        // Support legacy data with multiple active cash accounts by choosing a deterministic primary.
        return cashAccounts.stream().filter(a -> "Cash".equalsIgnoreCase(a.getName())).findFirst().orElse(cashAccounts.get(0));
    }

    private Account createCashAccount(Long businessId) {
        Business business = businessRepository
            .findById(businessId)
            .orElseThrow(() -> new BadRequestAlertException("Business not found", ENTITY_NAME, "businessnotfound"));

        Account cash = new Account();
        cash.setBusiness(business);
        cash.setName("Cash");
        cash.setType(AccountType.CASH);
        cash.setOpeningBalance(BigDecimal.ZERO);
        cash.setDeleted(false);
        // createdAt/updatedAt handled by @PrePersist
        return accountRepository.save(cash);
    }
}

