package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.AccountType;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Account} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class AccountDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(min = 1, max = 120)
    private String name;

    @NotNull
    private AccountType type;

    @NotNull
    private BigDecimal openingBalance;

    @Size(max = 32)
    private String accountNumber;

    @Size(max = 16)
    private String ifsc;

    @Size(max = 64)
    private String upiId;

    @Size(max = 1000)
    private String notes;

    private Boolean deleted;

    @NotNull
    private Instant createdAt;

    private Instant updatedAt;

    private BusinessDTO business;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AccountType getType() {
        return type;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getIfsc() {
        return ifsc;
    }

    public void setIfsc(String ifsc) {
        this.ifsc = ifsc;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public BusinessDTO getBusiness() {
        return business;
    }

    public void setBusiness(BusinessDTO business) {
        this.business = business;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof AccountDTO)) {
            return false;
        }

        AccountDTO accountDTO = (AccountDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, accountDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "AccountDTO{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", type='" + getType() + "'" +
            ", openingBalance=" + getOpeningBalance() +
            ", accountNumber='" + getAccountNumber() + "'" +
            ", ifsc='" + getIfsc() + "'" +
            ", upiId='" + getUpiId() + "'" +
            ", notes='" + getNotes() + "'" +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            "}";
    }
}
