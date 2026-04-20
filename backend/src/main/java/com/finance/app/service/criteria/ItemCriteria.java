package com.finance.app.service.criteria;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Item} entity. This class is used
 * in {@link com.finance.app.web.rest.ItemResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /items?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ItemCriteria implements Serializable, Criteria {

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private StringFilter name;

    private StringFilter sku;

    private StringFilter type;

    private BigDecimalFilter sellingPrice;

    private BigDecimalFilter purchasePrice;

    private BigDecimalFilter taxPercent;

    private StringFilter unit;

    private BooleanFilter active;

    private BooleanFilter deleted;

    private StringFilter description;

    private BigDecimalFilter openingStock;

    private BigDecimalFilter reorderLevel;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter businessId;

    private Boolean distinct;

    public ItemCriteria() {}

    public ItemCriteria(ItemCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.name = other.optionalName().map(StringFilter::copy).orElse(null);
        this.sku = other.optionalSku().map(StringFilter::copy).orElse(null);
        this.type = other.optionalType().map(StringFilter::copy).orElse(null);
        this.sellingPrice = other.optionalSellingPrice().map(BigDecimalFilter::copy).orElse(null);
        this.purchasePrice = other.optionalPurchasePrice().map(BigDecimalFilter::copy).orElse(null);
        this.taxPercent = other.optionalTaxPercent().map(BigDecimalFilter::copy).orElse(null);
        this.unit = other.optionalUnit().map(StringFilter::copy).orElse(null);
        this.active = other.optionalActive().map(BooleanFilter::copy).orElse(null);
        this.deleted = other.optionalDeleted().map(BooleanFilter::copy).orElse(null);
        this.description = other.optionalDescription().map(StringFilter::copy).orElse(null);
        this.openingStock = other.optionalOpeningStock().map(BigDecimalFilter::copy).orElse(null);
        this.reorderLevel = other.optionalReorderLevel().map(BigDecimalFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public ItemCriteria copy() {
        return new ItemCriteria(this);
    }

    public LongFilter getId() {
        return id;
    }

    public Optional<LongFilter> optionalId() {
        return Optional.ofNullable(id);
    }

    public LongFilter id() {
        if (id == null) {
            setId(new LongFilter());
        }
        return id;
    }

    public void setId(LongFilter id) {
        this.id = id;
    }

    public StringFilter getName() {
        return name;
    }

    public Optional<StringFilter> optionalName() {
        return Optional.ofNullable(name);
    }

    public StringFilter name() {
        if (name == null) {
            setName(new StringFilter());
        }
        return name;
    }

    public void setName(StringFilter name) {
        this.name = name;
    }

    public StringFilter getSku() {
        return sku;
    }

    public Optional<StringFilter> optionalSku() {
        return Optional.ofNullable(sku);
    }

    public StringFilter sku() {
        if (sku == null) {
            setSku(new StringFilter());
        }
        return sku;
    }

    public void setSku(StringFilter sku) {
        this.sku = sku;
    }

    public StringFilter getType() {
        return type;
    }

    public Optional<StringFilter> optionalType() {
        return Optional.ofNullable(type);
    }

    public StringFilter type() {
        if (type == null) {
            setType(new StringFilter());
        }
        return type;
    }

    public void setType(StringFilter type) {
        this.type = type;
    }

    public BigDecimalFilter getSellingPrice() {
        return sellingPrice;
    }

    public Optional<BigDecimalFilter> optionalSellingPrice() {
        return Optional.ofNullable(sellingPrice);
    }

    public BigDecimalFilter sellingPrice() {
        if (sellingPrice == null) {
            setSellingPrice(new BigDecimalFilter());
        }
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimalFilter sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimalFilter getPurchasePrice() {
        return purchasePrice;
    }

    public Optional<BigDecimalFilter> optionalPurchasePrice() {
        return Optional.ofNullable(purchasePrice);
    }

    public BigDecimalFilter purchasePrice() {
        if (purchasePrice == null) {
            setPurchasePrice(new BigDecimalFilter());
        }
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimalFilter purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimalFilter getTaxPercent() {
        return taxPercent;
    }

    public Optional<BigDecimalFilter> optionalTaxPercent() {
        return Optional.ofNullable(taxPercent);
    }

    public BigDecimalFilter taxPercent() {
        if (taxPercent == null) {
            setTaxPercent(new BigDecimalFilter());
        }
        return taxPercent;
    }

    public void setTaxPercent(BigDecimalFilter taxPercent) {
        this.taxPercent = taxPercent;
    }

    public StringFilter getUnit() {
        return unit;
    }

    public Optional<StringFilter> optionalUnit() {
        return Optional.ofNullable(unit);
    }

    public StringFilter unit() {
        if (unit == null) {
            setUnit(new StringFilter());
        }
        return unit;
    }

    public void setUnit(StringFilter unit) {
        this.unit = unit;
    }

    public BooleanFilter getActive() {
        return active;
    }

    public Optional<BooleanFilter> optionalActive() {
        return Optional.ofNullable(active);
    }

    public BooleanFilter active() {
        if (active == null) {
            setActive(new BooleanFilter());
        }
        return active;
    }

    public void setActive(BooleanFilter active) {
        this.active = active;
    }

    public BooleanFilter getDeleted() {
        return deleted;
    }

    public Optional<BooleanFilter> optionalDeleted() {
        return Optional.ofNullable(deleted);
    }

    public BooleanFilter deleted() {
        if (deleted == null) {
            setDeleted(new BooleanFilter());
        }
        return deleted;
    }

    public void setDeleted(BooleanFilter deleted) {
        this.deleted = deleted;
    }

    public StringFilter getDescription() {
        return description;
    }

    public Optional<StringFilter> optionalDescription() {
        return Optional.ofNullable(description);
    }

    public StringFilter description() {
        if (description == null) {
            setDescription(new StringFilter());
        }
        return description;
    }

    public void setDescription(StringFilter description) {
        this.description = description;
    }

    public BigDecimalFilter getOpeningStock() {
        return openingStock;
    }

    public Optional<BigDecimalFilter> optionalOpeningStock() {
        return Optional.ofNullable(openingStock);
    }

    public BigDecimalFilter openingStock() {
        if (openingStock == null) {
            setOpeningStock(new BigDecimalFilter());
        }
        return openingStock;
    }

    public void setOpeningStock(BigDecimalFilter openingStock) {
        this.openingStock = openingStock;
    }

    public BigDecimalFilter getReorderLevel() {
        return reorderLevel;
    }

    public Optional<BigDecimalFilter> optionalReorderLevel() {
        return Optional.ofNullable(reorderLevel);
    }

    public BigDecimalFilter reorderLevel() {
        if (reorderLevel == null) {
            setReorderLevel(new BigDecimalFilter());
        }
        return reorderLevel;
    }

    public void setReorderLevel(BigDecimalFilter reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public InstantFilter getCreatedAt() {
        return createdAt;
    }

    public Optional<InstantFilter> optionalCreatedAt() {
        return Optional.ofNullable(createdAt);
    }

    public InstantFilter createdAt() {
        if (createdAt == null) {
            setCreatedAt(new InstantFilter());
        }
        return createdAt;
    }

    public void setCreatedAt(InstantFilter createdAt) {
        this.createdAt = createdAt;
    }

    public InstantFilter getUpdatedAt() {
        return updatedAt;
    }

    public Optional<InstantFilter> optionalUpdatedAt() {
        return Optional.ofNullable(updatedAt);
    }

    public InstantFilter updatedAt() {
        if (updatedAt == null) {
            setUpdatedAt(new InstantFilter());
        }
        return updatedAt;
    }

    public void setUpdatedAt(InstantFilter updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LongFilter getBusinessId() {
        return businessId;
    }

    public Optional<LongFilter> optionalBusinessId() {
        return Optional.ofNullable(businessId);
    }

    public LongFilter businessId() {
        if (businessId == null) {
            setBusinessId(new LongFilter());
        }
        return businessId;
    }

    public void setBusinessId(LongFilter businessId) {
        this.businessId = businessId;
    }

    public Boolean getDistinct() {
        return distinct;
    }

    public Optional<Boolean> optionalDistinct() {
        return Optional.ofNullable(distinct);
    }

    public Boolean distinct() {
        if (distinct == null) {
            setDistinct(true);
        }
        return distinct;
    }

    public void setDistinct(Boolean distinct) {
        this.distinct = distinct;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        final ItemCriteria that = (ItemCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(name, that.name) &&
            Objects.equals(sku, that.sku) &&
            Objects.equals(type, that.type) &&
            Objects.equals(sellingPrice, that.sellingPrice) &&
            Objects.equals(purchasePrice, that.purchasePrice) &&
            Objects.equals(taxPercent, that.taxPercent) &&
            Objects.equals(unit, that.unit) &&
            Objects.equals(active, that.active) &&
            Objects.equals(deleted, that.deleted) &&
            Objects.equals(description, that.description) &&
            Objects.equals(openingStock, that.openingStock) &&
            Objects.equals(reorderLevel, that.reorderLevel) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(businessId, that.businessId) &&
            Objects.equals(distinct, that.distinct)
        );
    }

    @Override
    public int hashCode() {
        return Objects.hash(
            id,
            name,
            sku,
            type,
            sellingPrice,
            purchasePrice,
            taxPercent,
            unit,
            active,
            deleted,
            description,
            openingStock,
            reorderLevel,
            createdAt,
            updatedAt,
            businessId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ItemCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalName().map(f -> "name=" + f + ", ").orElse("") +
            optionalSku().map(f -> "sku=" + f + ", ").orElse("") +
            optionalType().map(f -> "type=" + f + ", ").orElse("") +
            optionalSellingPrice().map(f -> "sellingPrice=" + f + ", ").orElse("") +
            optionalPurchasePrice().map(f -> "purchasePrice=" + f + ", ").orElse("") +
            optionalTaxPercent().map(f -> "taxPercent=" + f + ", ").orElse("") +
            optionalUnit().map(f -> "unit=" + f + ", ").orElse("") +
            optionalActive().map(f -> "active=" + f + ", ").orElse("") +
            optionalDeleted().map(f -> "deleted=" + f + ", ").orElse("") +
            optionalDescription().map(f -> "description=" + f + ", ").orElse("") +
            optionalOpeningStock().map(f -> "openingStock=" + f + ", ").orElse("") +
            optionalReorderLevel().map(f -> "reorderLevel=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
