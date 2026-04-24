package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.AdjustmentDirection;
import com.finance.app.domain.enumeration.TransferKind;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Transfer.
 */
@Entity
@Table(name = "transfer")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Transfer implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "date", nullable = false)
    private Instant date;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "amount", precision = 21, scale = 2, nullable = false)
    private BigDecimal amount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "transfer_kind", nullable = false)
    private TransferKind transferKind;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_direction")
    private AdjustmentDirection adjustmentDirection;

    @Size(max = 2000)
    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "proof_data_url")
    private String proofDataUrl;

    @Size(max = 255)
    @Column(name = "proof_name", length = 255)
    private String proofName;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Account fromAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Account toAccount;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.transferKind == null) {
            this.transferKind = TransferKind.TRANSFER;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return this.id;
    }

    public Transfer id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getDate() {
        return this.date;
    }

    public Transfer date(Instant date) {
        this.setDate(date);
        return this;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public Transfer amount(BigDecimal amount) {
        this.setAmount(amount);
        return this;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public TransferKind getTransferKind() {
        return this.transferKind;
    }

    public Transfer transferKind(TransferKind transferKind) {
        this.setTransferKind(transferKind);
        return this;
    }

    public void setTransferKind(TransferKind transferKind) {
        this.transferKind = transferKind;
    }

    public AdjustmentDirection getAdjustmentDirection() {
        return this.adjustmentDirection;
    }

    public Transfer adjustmentDirection(AdjustmentDirection adjustmentDirection) {
        this.setAdjustmentDirection(adjustmentDirection);
        return this;
    }

    public void setAdjustmentDirection(AdjustmentDirection adjustmentDirection) {
        this.adjustmentDirection = adjustmentDirection;
    }

    public String getNotes() {
        return this.notes;
    }

    public Transfer notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getProofDataUrl() {
        return this.proofDataUrl;
    }

    public Transfer proofDataUrl(String proofDataUrl) {
        this.setProofDataUrl(proofDataUrl);
        return this;
    }

    public void setProofDataUrl(String proofDataUrl) {
        this.proofDataUrl = proofDataUrl;
    }

    public String getProofName() {
        return this.proofName;
    }

    public Transfer proofName(String proofName) {
        this.setProofName(proofName);
        return this;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Transfer createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Transfer updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Business getBusiness() {
        return this.business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Transfer business(Business business) {
        this.setBusiness(business);
        return this;
    }

    public Account getFromAccount() {
        return this.fromAccount;
    }

    public void setFromAccount(Account account) {
        this.fromAccount = account;
    }

    public Transfer fromAccount(Account account) {
        this.setFromAccount(account);
        return this;
    }

    public Account getToAccount() {
        return this.toAccount;
    }

    public void setToAccount(Account account) {
        this.toAccount = account;
    }

    public Transfer toAccount(Account account) {
        this.setToAccount(account);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Transfer)) {
            return false;
        }
        return getId() != null && getId().equals(((Transfer) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Transfer{" +
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
            "}";
    }
}
