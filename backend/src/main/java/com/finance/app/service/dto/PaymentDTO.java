package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.PaymentDirection;
import com.finance.app.domain.enumeration.PaymentMode;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Payment} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PaymentDTO implements Serializable {

    private Long id;

    @NotNull
    private PaymentDirection direction;

    @NotNull
    private Instant date;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal amount;

    @NotNull
    private PaymentMode mode;

    @Size(max = 120)
    private String reference;

    @Size(max = 2000)
    private String notes;

    private String proofDataUrl;

    @Size(max = 255)
    private String proofName;

    private Instant createdAt;

    private Instant updatedAt;

    private BusinessDTO business;

    private PartyDTO party;

    private AccountDTO account;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PaymentDirection getDirection() {
        return direction;
    }

    public void setDirection(PaymentDirection direction) {
        this.direction = direction;
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

    public PaymentMode getMode() {
        return mode;
    }

    public void setMode(PaymentMode mode) {
        this.mode = mode;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public PartyDTO getParty() {
        return party;
    }

    public void setParty(PartyDTO party) {
        this.party = party;
    }

    public AccountDTO getAccount() {
        return account;
    }

    public void setAccount(AccountDTO account) {
        this.account = account;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PaymentDTO)) {
            return false;
        }

        PaymentDTO paymentDTO = (PaymentDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, paymentDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PaymentDTO{" +
            "id=" + getId() +
            ", direction='" + getDirection() + "'" +
            ", date='" + getDate() + "'" +
            ", amount=" + getAmount() +
            ", mode='" + getMode() + "'" +
            ", reference='" + getReference() + "'" +
            ", notes='" + getNotes() + "'" +
            ", proofName='" + getProofName() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            ", party=" + getParty() +
            ", account=" + getAccount() +
            "}";
    }
}
