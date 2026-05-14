package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.PaymentMode;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Expense.
 */
@Entity
@Table(name = "expense")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Expense implements Serializable {

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
    @Size(max = 120)
    @Column(name = "category", length = 120, nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode")
    private PaymentMode mode;

    @Size(max = 120)
    @Column(name = "reference", length = 120)
    private String reference;

    @Size(max = 2000)
    @Column(name = "notes", length = 2000)
    private String notes;

    @DecimalMin(value = "0")
    @Column(name = "received_paid_amount", precision = 21, scale = 2)
    private BigDecimal receivedPaidAmount;

    @DecimalMin(value = "0")
    @Column(name = "balance_due", precision = 21, scale = 2)
    private BigDecimal balanceDue;

    @Size(max = 120)
    @Column(name = "order_no", length = 120)
    private String orderNo;

    @Size(max = 200)
    @Column(name = "item_name", length = 200)
    private String itemName;

    @Size(max = 2000)
    @Column(name = "item_description", length = 2000)
    private String itemDescription;

    @Size(max = 64)
    @Column(name = "hsn_sac", length = 64)
    private String hsnSac;

    @DecimalMin(value = "0")
    @Column(name = "quantity", precision = 21, scale = 2)
    private BigDecimal quantity;

    @DecimalMin(value = "0")
    @Column(name = "unit_price", precision = 21, scale = 2)
    private BigDecimal unitPrice;

    @DecimalMin(value = "0")
    @Column(name = "discount_percent", precision = 21, scale = 2)
    private BigDecimal discountPercent;

    @DecimalMin(value = "0")
    @Column(name = "discount_amount", precision = 21, scale = 2)
    private BigDecimal discountAmount;

    @DecimalMin(value = "0")
    @Column(name = "tax_percent", precision = 21, scale = 2)
    private BigDecimal taxPercent;

    @DecimalMin(value = "0")
    @Column(name = "tax_amount", precision = 21, scale = 2)
    private BigDecimal taxAmount;

    @DecimalMin(value = "0")
    @Column(name = "line_amount", precision = 21, scale = 2)
    private BigDecimal lineAmount;

    @Lob
    @Column(name = "proof_data_url")
    private String proofDataUrl;

    @Size(max = 255)
    @Column(name = "proof_name", length = 255)
    private String proofName;

    @Column(name = "deleted")
    private Boolean deleted;

    @Column(name = "exclude_from_ledger")
    private Boolean excludeFromLedger;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Party party;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Account account;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return this.id;
    }

    public Expense id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getDate() {
        return this.date;
    }

    public Expense date(Instant date) {
        this.setDate(date);
        return this;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public Expense amount(BigDecimal amount) {
        this.setAmount(amount);
        return this;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return this.category;
    }

    public Expense category(String category) {
        this.setCategory(category);
        return this;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public PaymentMode getMode() {
        return this.mode;
    }

    public Expense mode(PaymentMode mode) {
        this.setMode(mode);
        return this;
    }

    public void setMode(PaymentMode mode) {
        this.mode = mode;
    }

    public String getReference() {
        return this.reference;
    }

    public Expense reference(String reference) {
        this.setReference(reference);
        return this;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNotes() {
        return this.notes;
    }

    public Expense notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getReceivedPaidAmount() {
        return this.receivedPaidAmount;
    }

    public Expense receivedPaidAmount(BigDecimal receivedPaidAmount) {
        this.setReceivedPaidAmount(receivedPaidAmount);
        return this;
    }

    public void setReceivedPaidAmount(BigDecimal receivedPaidAmount) {
        this.receivedPaidAmount = receivedPaidAmount;
    }

    public BigDecimal getBalanceDue() {
        return this.balanceDue;
    }

    public Expense balanceDue(BigDecimal balanceDue) {
        this.setBalanceDue(balanceDue);
        return this;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public String getOrderNo() {
        return this.orderNo;
    }

    public Expense orderNo(String orderNo) {
        this.setOrderNo(orderNo);
        return this;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getItemName() {
        return this.itemName;
    }

    public Expense itemName(String itemName) {
        this.setItemName(itemName);
        return this;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemDescription() {
        return this.itemDescription;
    }

    public Expense itemDescription(String itemDescription) {
        this.setItemDescription(itemDescription);
        return this;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public String getHsnSac() {
        return this.hsnSac;
    }

    public Expense hsnSac(String hsnSac) {
        this.setHsnSac(hsnSac);
        return this;
    }

    public void setHsnSac(String hsnSac) {
        this.hsnSac = hsnSac;
    }

    public BigDecimal getQuantity() {
        return this.quantity;
    }

    public Expense quantity(BigDecimal quantity) {
        this.setQuantity(quantity);
        return this;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return this.unitPrice;
    }

    public Expense unitPrice(BigDecimal unitPrice) {
        this.setUnitPrice(unitPrice);
        return this;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getDiscountPercent() {
        return this.discountPercent;
    }

    public Expense discountPercent(BigDecimal discountPercent) {
        this.setDiscountPercent(discountPercent);
        return this;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getDiscountAmount() {
        return this.discountAmount;
    }

    public Expense discountAmount(BigDecimal discountAmount) {
        this.setDiscountAmount(discountAmount);
        return this;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTaxPercent() {
        return this.taxPercent;
    }

    public Expense taxPercent(BigDecimal taxPercent) {
        this.setTaxPercent(taxPercent);
        return this;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public BigDecimal getTaxAmount() {
        return this.taxAmount;
    }

    public Expense taxAmount(BigDecimal taxAmount) {
        this.setTaxAmount(taxAmount);
        return this;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getLineAmount() {
        return this.lineAmount;
    }

    public Expense lineAmount(BigDecimal lineAmount) {
        this.setLineAmount(lineAmount);
        return this;
    }

    public void setLineAmount(BigDecimal lineAmount) {
        this.lineAmount = lineAmount;
    }

    public String getProofDataUrl() {
        return this.proofDataUrl;
    }

    public Expense proofDataUrl(String proofDataUrl) {
        this.setProofDataUrl(proofDataUrl);
        return this;
    }

    public void setProofDataUrl(String proofDataUrl) {
        this.proofDataUrl = proofDataUrl;
    }

    public String getProofName() {
        return this.proofName;
    }

    public Expense proofName(String proofName) {
        this.setProofName(proofName);
        return this;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
    }

    public Boolean getDeleted() {
        return this.deleted;
    }

    public Expense deleted(Boolean deleted) {
        this.setDeleted(deleted);
        return this;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Boolean getExcludeFromLedger() {
        return this.excludeFromLedger;
    }

    public Expense excludeFromLedger(Boolean excludeFromLedger) {
        this.setExcludeFromLedger(excludeFromLedger);
        return this;
    }

    public void setExcludeFromLedger(Boolean excludeFromLedger) {
        this.excludeFromLedger = excludeFromLedger;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Expense createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Expense updatedAt(Instant updatedAt) {
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

    public Expense business(Business business) {
        this.setBusiness(business);
        return this;
    }

    public Party getParty() {
        return this.party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public Expense party(Party party) {
        this.setParty(party);
        return this;
    }

    public Account getAccount() {
        return this.account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public Expense account(Account account) {
        this.setAccount(account);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Expense)) {
            return false;
        }
        return getId() != null && getId().equals(((Expense) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Expense{" +
            "id=" + getId() +
            ", date='" + getDate() + "'" +
            ", amount=" + getAmount() +
            ", category='" + getCategory() + "'" +
            ", mode='" + getMode() + "'" +
            ", reference='" + getReference() + "'" +
            ", notes='" + getNotes() + "'" +
            ", receivedPaidAmount=" + getReceivedPaidAmount() +
            ", balanceDue=" + getBalanceDue() +
            ", orderNo='" + getOrderNo() + "'" +
            ", itemName='" + getItemName() + "'" +
            ", itemDescription='" + getItemDescription() + "'" +
            ", hsnSac='" + getHsnSac() + "'" +
            ", quantity=" + getQuantity() +
            ", unitPrice=" + getUnitPrice() +
            ", discountPercent=" + getDiscountPercent() +
            ", discountAmount=" + getDiscountAmount() +
            ", taxPercent=" + getTaxPercent() +
            ", taxAmount=" + getTaxAmount() +
            ", lineAmount=" + getLineAmount() +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            "}";
    }
}
