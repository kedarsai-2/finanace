package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.AdjustmentDirection;
import com.finance.app.domain.enumeration.TransferKind;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Transfer} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class TransferDTO implements Serializable {

    private Long id;

    @NotNull
    private Instant date;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal amount;

    @NotNull
    private TransferKind transferKind;

    private AdjustmentDirection adjustmentDirection;

    @Size(max = 2000)
    private String notes;

    private String proofDataUrl;

    @Size(max = 255)
    private String proofName;

    private Instant createdAt;

    private Instant updatedAt;

    private BusinessDTO business;

    private AccountDTO fromAccount;

    private AccountDTO toAccount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public TransferKind getTransferKind() {
        return transferKind;
    }

    public void setTransferKind(TransferKind transferKind) {
        this.transferKind = transferKind;
    }

    public AdjustmentDirection getAdjustmentDirection() {
        return adjustmentDirection;
    }

    public void setAdjustmentDirection(AdjustmentDirection adjustmentDirection) {
        this.adjustmentDirection = adjustmentDirection;
    }

    public String getProofDataUrl() {
        return proofDataUrl;
    }

    public void setProofDataUrl(String proofDataUrl) {
        this.proofDataUrl = proofDataUrl;
    }

    public String getProofName() {
        return proofName;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
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

    public AccountDTO getFromAccount() {
        return fromAccount;
    }

    public void setFromAccount(AccountDTO fromAccount) {
        this.fromAccount = fromAccount;
    }

    public AccountDTO getToAccount() {
        return toAccount;
    }

    public void setToAccount(AccountDTO toAccount) {
        this.toAccount = toAccount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TransferDTO)) {
            return false;
        }

        TransferDTO transferDTO = (TransferDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, transferDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "TransferDTO{" +
            "id=" + getId() +
            ", date='" + getDate() + "'" +
            ", amount=" + getAmount() +
            ", transferKind='" + getTransferKind() + "'" +
            ", adjustmentDirection='" + getAdjustmentDirection() + "'" +
            ", notes='" + getNotes() + "'" +
            ", proofDataUrl='" + getProofDataUrl() + "'" +
            ", proofName='" + getProofName() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            ", fromAccount=" + getFromAccount() +
            ", toAccount=" + getToAccount() +
            "}";
    }
}
