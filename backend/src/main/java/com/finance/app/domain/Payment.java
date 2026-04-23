package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.PaymentDirection;
import com.finance.app.domain.enumeration.PaymentMode;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Payment.
 */
@Entity
@Table(name = "payment")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Payment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false)
    private PaymentDirection direction;

    @NotNull
    @Column(name = "date", nullable = false)
    private Instant date;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "amount", precision = 21, scale = 2, nullable = false)
    private BigDecimal amount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private PaymentMode mode;

    @Size(max = 120)
    @Column(name = "reference", length = 120)
    private String reference;

    @Size(max = 2000)
    @Column(name = "notes", length = 2000)
    private String notes;

    @Lob
    @Column(name = "proof_data_url")
    private String proofDataUrl;

    @Size(max = 255)
    @Column(name = "proof_name", length = 255)
    private String proofName;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "payment")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "payment" }, allowSetters = true)
    private Set<PaymentAllocation> allocationses = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Party party;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Account account;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Payment id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PaymentDirection getDirection() {
        return this.direction;
    }

    public Payment direction(PaymentDirection direction) {
        this.setDirection(direction);
        return this;
    }

    public void setDirection(PaymentDirection direction) {
        this.direction = direction;
    }

    public Instant getDate() {
        return this.date;
    }

    public Payment date(Instant date) {
        this.setDate(date);
        return this;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public Payment amount(BigDecimal amount) {
        this.setAmount(amount);
        return this;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMode getMode() {
        return this.mode;
    }

    public Payment mode(PaymentMode mode) {
        this.setMode(mode);
        return this;
    }

    public void setMode(PaymentMode mode) {
        this.mode = mode;
    }

    public String getReference() {
        return this.reference;
    }

    public Payment reference(String reference) {
        this.setReference(reference);
        return this;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNotes() {
        return this.notes;
    }

    public Payment notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getProofDataUrl() {
        return this.proofDataUrl;
    }

    public Payment proofDataUrl(String proofDataUrl) {
        this.setProofDataUrl(proofDataUrl);
        return this;
    }

    public void setProofDataUrl(String proofDataUrl) {
        this.proofDataUrl = proofDataUrl;
    }

    public String getProofName() {
        return this.proofName;
    }

    public Payment proofName(String proofName) {
        this.setProofName(proofName);
        return this;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Payment createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Payment updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<PaymentAllocation> getAllocationses() {
        return this.allocationses;
    }

    public void setAllocationses(Set<PaymentAllocation> paymentAllocations) {
        if (this.allocationses != null) {
            this.allocationses.forEach(i -> i.setPayment(null));
        }
        if (paymentAllocations != null) {
            paymentAllocations.forEach(i -> i.setPayment(this));
        }
        this.allocationses = paymentAllocations;
    }

    public Payment allocationses(Set<PaymentAllocation> paymentAllocations) {
        this.setAllocationses(paymentAllocations);
        return this;
    }

    public Payment addAllocations(PaymentAllocation paymentAllocation) {
        this.allocationses.add(paymentAllocation);
        paymentAllocation.setPayment(this);
        return this;
    }

    public Payment removeAllocations(PaymentAllocation paymentAllocation) {
        this.allocationses.remove(paymentAllocation);
        paymentAllocation.setPayment(null);
        return this;
    }

    public Business getBusiness() {
        return this.business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Payment business(Business business) {
        this.setBusiness(business);
        return this;
    }

    public Party getParty() {
        return this.party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public Payment party(Party party) {
        this.setParty(party);
        return this;
    }

    public Account getAccount() {
        return this.account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public Payment account(Account account) {
        this.setAccount(account);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Payment)) {
            return false;
        }
        return getId() != null && getId().equals(((Payment) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Payment{" +
            "id=" + getId() +
            ", direction='" + getDirection() + "'" +
            ", date='" + getDate() + "'" +
            ", amount=" + getAmount() +
            ", mode='" + getMode() + "'" +
            ", reference='" + getReference() + "'" +
            ", notes='" + getNotes() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            "}";
    }
}
