package com.finance.app.service;

import com.finance.app.domain.Account;
import com.finance.app.domain.enumeration.PaymentDirection;
import com.finance.app.repository.AccountRepository;
import com.finance.app.repository.ExpenseRepository;
import com.finance.app.repository.PaymentRepository;
import com.finance.app.repository.TransferRepository;
import com.finance.app.service.dto.CashBalanceDTO;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CashBalanceService {

    private final CashLedgerAccountService cashLedgerAccountService;
    private final AccountRepository accountRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final TransferRepository transferRepository;

    public CashBalanceService(
        CashLedgerAccountService cashLedgerAccountService,
        AccountRepository accountRepository,
        PaymentRepository paymentRepository,
        ExpenseRepository expenseRepository,
        TransferRepository transferRepository
    ) {
        this.cashLedgerAccountService = cashLedgerAccountService;
        this.accountRepository = accountRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.transferRepository = transferRepository;
    }

    public CashBalanceDTO getSnapshot(Long businessId) {
        Account cash = cashLedgerAccountService.getOrCreateCashAccount(businessId);
        return toSnapshot(businessId, cash);
    }

    public CashBalanceDTO setOpeningBalance(Long businessId, BigDecimal openingBalance) {
        Account cash = cashLedgerAccountService.getOrCreateCashAccount(businessId);
        cash.setOpeningBalance(openingBalance == null ? BigDecimal.ZERO : openingBalance);
        cash = accountRepository.save(cash);
        return toSnapshot(businessId, cash);
    }

    private CashBalanceDTO toSnapshot(Long businessId, Account cash) {
        Long cashAccountId = cash.getId();

        BigDecimal opening = cash.getOpeningBalance() == null ? BigDecimal.ZERO : cash.getOpeningBalance();
        BigDecimal signedPayments = paymentRepository.sumSignedAmountByAccountId(cashAccountId, PaymentDirection.IN);
        BigDecimal expenses = expenseRepository.sumAmountByAccountId(cashAccountId);
        BigDecimal incomingTransfers = transferRepository.sumIncomingByAccountId(cashAccountId);
        BigDecimal outgoingTransfers = transferRepository.sumOutgoingByAccountId(cashAccountId);

        BigDecimal current = opening
            .add(signedPayments)
            .add(incomingTransfers)
            .subtract(outgoingTransfers)
            .subtract(expenses);

        CashBalanceDTO dto = new CashBalanceDTO();
        dto.setBusinessId(businessId);
        dto.setCashAccountId(cashAccountId);
        dto.setOpeningBalance(opening);
        dto.setCurrentBalance(current);
        return dto;
    }
}

