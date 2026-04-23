package com.finance.app.service.dto;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Cash balance snapshot for a business.
 *
 * This is intentionally separate from the Account DTO to keep the frontend "cash"
 * UX stable even if internal implementation uses an Account ledger.
 */
public class CashBalanceDTO implements Serializable {

    private Long businessId;
    private Long cashAccountId;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;

    public Long getBusinessId() {
        return businessId;
    }

    public void setBusinessId(Long businessId) {
        this.businessId = businessId;
    }

    public Long getCashAccountId() {
        return cashAccountId;
    }

    public void setCashAccountId(Long cashAccountId) {
        this.cashAccountId = cashAccountId;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }
}

