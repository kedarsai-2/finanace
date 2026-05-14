package com.finance.app.service;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.enumeration.AccountType;
import com.finance.app.repository.AccountRepository;
import com.finance.app.repository.BusinessRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures each business has at least one active {@link AccountType#BANK} account, same pattern as
 * {@link CashLedgerAccountService} for cash. Used when recording bank/UPI payments or expenses
 * without an explicit account.
 */
@Service
@Transactional
public class BankLedgerAccountService {

    private final AccountRepository accountRepository;
    private final BusinessRepository businessRepository;

    public BankLedgerAccountService(AccountRepository accountRepository, BusinessRepository businessRepository) {
        this.accountRepository = accountRepository;
        this.businessRepository = businessRepository;
    }

    public Account getOrCreatePrimaryBankAccount(Long businessId) {
        List<Account> banks = accountRepository.findAllActiveByBusinessIdAndType(businessId, AccountType.BANK);
        if (banks.isEmpty()) {
            return createPrimaryBankAccount(businessId);
        }
        return banks
            .stream()
            .filter(a -> "Bank".equalsIgnoreCase(a.getName()))
            .findFirst()
            .orElse(banks.get(0));
    }

    private Account createPrimaryBankAccount(Long businessId) {
        Business business = businessRepository
            .findById(businessId)
            .orElseThrow(() -> new BusinessNotFoundException(businessId));

        Account bank = new Account();
        bank.setBusiness(business);
        bank.setName("Bank");
        bank.setType(AccountType.BANK);
        bank.setOpeningBalance(BigDecimal.ZERO);
        bank.setDeleted(false);
        return accountRepository.save(bank);
    }
}
