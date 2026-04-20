package com.finance.app.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.PaymentAllocation} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PaymentAllocationDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(max = 64)
    private String docId;

    @NotNull
    @Size(max = 32)
    private String docNumber;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal amount;

    @NotNull
    private PaymentDTO payment;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocId() {
        return docId;
    }

    public void setDocId(String docId) {
        this.docId = docId;
    }

    public String getDocNumber() {
        return docNumber;
    }

    public void setDocNumber(String docNumber) {
        this.docNumber = docNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentDTO getPayment() {
        return payment;
    }

    public void setPayment(PaymentDTO payment) {
        this.payment = payment;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PaymentAllocationDTO)) {
            return false;
        }

        PaymentAllocationDTO paymentAllocationDTO = (PaymentAllocationDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, paymentAllocationDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PaymentAllocationDTO{" +
            "id=" + getId() +
            ", docId='" + getDocId() + "'" +
            ", docNumber='" + getDocNumber() + "'" +
            ", amount=" + getAmount() +
            ", payment=" + getPayment() +
            "}";
    }
}
