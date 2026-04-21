package com.finance.app.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.ExpenseCategory} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ExpenseCategoryDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(min = 1, max = 120)
    private String name;

    private Boolean deleted;

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
        if (!(o instanceof ExpenseCategoryDTO)) {
            return false;
        }

        ExpenseCategoryDTO expenseCategoryDTO = (ExpenseCategoryDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, expenseCategoryDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ExpenseCategoryDTO{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            "}";
    }
}
