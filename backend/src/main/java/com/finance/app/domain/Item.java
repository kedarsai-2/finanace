package com.finance.app.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Item.
 */
@Entity
@Table(name = "item")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Item implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(min = 1, max = 200)
    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Size(max = 64)
    @Column(name = "sku", length = 64)
    private String sku;

    @NotNull
    @Column(name = "type", nullable = false)
    private String type;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "selling_price", precision = 21, scale = 2, nullable = false)
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0")
    @Column(name = "purchase_price", precision = 21, scale = 2)
    private BigDecimal purchasePrice;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "100")
    @Column(name = "tax_percent", precision = 21, scale = 2, nullable = false)
    private BigDecimal taxPercent;

    @NotNull
    @Size(max = 20)
    @Column(name = "unit", length = 20, nullable = false)
    private String unit;

    @NotNull
    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "deleted")
    private Boolean deleted;

    @Size(max = 2000)
    @Column(name = "description", length = 2000)
    private String description;

    @DecimalMin(value = "0")
    @Column(name = "opening_stock", precision = 21, scale = 2)
    private BigDecimal openingStock;

    @DecimalMin(value = "0")
    @Column(name = "reorder_level", precision = 21, scale = 2)
    private BigDecimal reorderLevel;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Item id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public Item name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSku() {
        return this.sku;
    }

    public Item sku(String sku) {
        this.setSku(sku);
        return this;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getType() {
        return this.type;
    }

    public Item type(String type) {
        this.setType(type);
        return this;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getSellingPrice() {
        return this.sellingPrice;
    }

    public Item sellingPrice(BigDecimal sellingPrice) {
        this.setSellingPrice(sellingPrice);
        return this;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getPurchasePrice() {
        return this.purchasePrice;
    }

    public Item purchasePrice(BigDecimal purchasePrice) {
        this.setPurchasePrice(purchasePrice);
        return this;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimal getTaxPercent() {
        return this.taxPercent;
    }

    public Item taxPercent(BigDecimal taxPercent) {
        this.setTaxPercent(taxPercent);
        return this;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public String getUnit() {
        return this.unit;
    }

    public Item unit(String unit) {
        this.setUnit(unit);
        return this;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Boolean getActive() {
        return this.active;
    }

    public Item active(Boolean active) {
        this.setActive(active);
        return this;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Boolean getDeleted() {
        return this.deleted;
    }

    public Item deleted(Boolean deleted) {
        this.setDeleted(deleted);
        return this;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public String getDescription() {
        return this.description;
    }

    public Item description(String description) {
        this.setDescription(description);
        return this;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getOpeningStock() {
        return this.openingStock;
    }

    public Item openingStock(BigDecimal openingStock) {
        this.setOpeningStock(openingStock);
        return this;
    }

    public void setOpeningStock(BigDecimal openingStock) {
        this.openingStock = openingStock;
    }

    public BigDecimal getReorderLevel() {
        return this.reorderLevel;
    }

    public Item reorderLevel(BigDecimal reorderLevel) {
        this.setReorderLevel(reorderLevel);
        return this;
    }

    public void setReorderLevel(BigDecimal reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Item createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Item updatedAt(Instant updatedAt) {
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

    public Item business(Business business) {
        this.setBusiness(business);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Item)) {
            return false;
        }
        return getId() != null && getId().equals(((Item) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Item{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", sku='" + getSku() + "'" +
            ", type='" + getType() + "'" +
            ", sellingPrice=" + getSellingPrice() +
            ", purchasePrice=" + getPurchasePrice() +
            ", taxPercent=" + getTaxPercent() +
            ", unit='" + getUnit() + "'" +
            ", active='" + getActive() + "'" +
            ", deleted='" + getDeleted() + "'" +
            ", description='" + getDescription() + "'" +
            ", openingStock=" + getOpeningStock() +
            ", reorderLevel=" + getReorderLevel() +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            "}";
    }
}
