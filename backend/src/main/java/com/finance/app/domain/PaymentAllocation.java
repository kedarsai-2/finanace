package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A PaymentAllocation.
 */
@Entity
@Table(name = "payment_allocation")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PaymentAllocation implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 64)
    @Column(name = "doc_id", length = 64, nullable = false)
    private String docId;

    @NotNull
    @Size(max = 32)
    @Column(name = "doc_number", length = 32, nullable = false)
    private String docNumber;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "amount", precision = 21, scale = 2, nullable = false)
    private BigDecimal amount;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "allocationses", "business", "party", "account" }, allowSetters = true)
    private Payment payment;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public PaymentAllocation id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocId() {
        return this.docId;
    }

    public PaymentAllocation docId(String docId) {
        this.setDocId(docId);
        return this;
    }

    public void setDocId(String docId) {
        this.docId = docId;
    }

    public String getDocNumber() {
        return this.docNumber;
    }

    public PaymentAllocation docNumber(String docNumber) {
        this.setDocNumber(docNumber);
        return this;
    }

    public void setDocNumber(String docNumber) {
        this.docNumber = docNumber;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public PaymentAllocation amount(BigDecimal amount) {
        this.setAmount(amount);
        return this;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Payment getPayment() {
        return this.payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public PaymentAllocation payment(Payment payment) {
        this.setPayment(payment);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PaymentAllocation)) {
            return false;
        }
        return getId() != null && getId().equals(((PaymentAllocation) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PaymentAllocation{" +
            "id=" + getId() +
            ", docId='" + getDocId() + "'" +
            ", docNumber='" + getDocNumber() + "'" +
            ", amount=" + getAmount() +
            "}";
    }
}
