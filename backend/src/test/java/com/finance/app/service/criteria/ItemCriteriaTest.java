package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class ItemCriteriaTest {

    @Test
    void newItemCriteriaHasAllFiltersNullTest() {
        var itemCriteria = new ItemCriteria();
        assertThat(itemCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void itemCriteriaFluentMethodsCreatesFiltersTest() {
        var itemCriteria = new ItemCriteria();

        setAllFilters(itemCriteria);

        assertThat(itemCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void itemCriteriaCopyCreatesNullFilterTest() {
        var itemCriteria = new ItemCriteria();
        var copy = itemCriteria.copy();

        assertThat(itemCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(itemCriteria)
        );
    }

    @Test
    void itemCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var itemCriteria = new ItemCriteria();
        setAllFilters(itemCriteria);

        var copy = itemCriteria.copy();

        assertThat(itemCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(itemCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var itemCriteria = new ItemCriteria();

        assertThat(itemCriteria).hasToString("ItemCriteria{}");
    }

    private static void setAllFilters(ItemCriteria itemCriteria) {
        itemCriteria.id();
        itemCriteria.name();
        itemCriteria.sku();
        itemCriteria.type();
        itemCriteria.sellingPrice();
        itemCriteria.purchasePrice();
        itemCriteria.taxPercent();
        itemCriteria.unit();
        itemCriteria.active();
        itemCriteria.deleted();
        itemCriteria.description();
        itemCriteria.openingStock();
        itemCriteria.reorderLevel();
        itemCriteria.createdAt();
        itemCriteria.updatedAt();
        itemCriteria.businessId();
        itemCriteria.distinct();
    }

    private static Condition<ItemCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getName()) &&
                condition.apply(criteria.getSku()) &&
                condition.apply(criteria.getType()) &&
                condition.apply(criteria.getSellingPrice()) &&
                condition.apply(criteria.getPurchasePrice()) &&
                condition.apply(criteria.getTaxPercent()) &&
                condition.apply(criteria.getUnit()) &&
                condition.apply(criteria.getActive()) &&
                condition.apply(criteria.getDeleted()) &&
                condition.apply(criteria.getDescription()) &&
                condition.apply(criteria.getOpeningStock()) &&
                condition.apply(criteria.getReorderLevel()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<ItemCriteria> copyFiltersAre(ItemCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getName(), copy.getName()) &&
                condition.apply(criteria.getSku(), copy.getSku()) &&
                condition.apply(criteria.getType(), copy.getType()) &&
                condition.apply(criteria.getSellingPrice(), copy.getSellingPrice()) &&
                condition.apply(criteria.getPurchasePrice(), copy.getPurchasePrice()) &&
                condition.apply(criteria.getTaxPercent(), copy.getTaxPercent()) &&
                condition.apply(criteria.getUnit(), copy.getUnit()) &&
                condition.apply(criteria.getActive(), copy.getActive()) &&
                condition.apply(criteria.getDeleted(), copy.getDeleted()) &&
                condition.apply(criteria.getDescription(), copy.getDescription()) &&
                condition.apply(criteria.getOpeningStock(), copy.getOpeningStock()) &&
                condition.apply(criteria.getReorderLevel(), copy.getReorderLevel()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
