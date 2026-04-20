package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class TransferCriteriaTest {

    @Test
    void newTransferCriteriaHasAllFiltersNullTest() {
        var transferCriteria = new TransferCriteria();
        assertThat(transferCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void transferCriteriaFluentMethodsCreatesFiltersTest() {
        var transferCriteria = new TransferCriteria();

        setAllFilters(transferCriteria);

        assertThat(transferCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void transferCriteriaCopyCreatesNullFilterTest() {
        var transferCriteria = new TransferCriteria();
        var copy = transferCriteria.copy();

        assertThat(transferCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(transferCriteria)
        );
    }

    @Test
    void transferCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var transferCriteria = new TransferCriteria();
        setAllFilters(transferCriteria);

        var copy = transferCriteria.copy();

        assertThat(transferCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(transferCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var transferCriteria = new TransferCriteria();

        assertThat(transferCriteria).hasToString("TransferCriteria{}");
    }

    private static void setAllFilters(TransferCriteria transferCriteria) {
        transferCriteria.id();
        transferCriteria.date();
        transferCriteria.amount();
        transferCriteria.notes();
        transferCriteria.createdAt();
        transferCriteria.updatedAt();
        transferCriteria.businessId();
        transferCriteria.fromAccountId();
        transferCriteria.toAccountId();
        transferCriteria.distinct();
    }

    private static Condition<TransferCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getDate()) &&
                condition.apply(criteria.getAmount()) &&
                condition.apply(criteria.getNotes()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getFromAccountId()) &&
                condition.apply(criteria.getToAccountId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<TransferCriteria> copyFiltersAre(TransferCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getDate(), copy.getDate()) &&
                condition.apply(criteria.getAmount(), copy.getAmount()) &&
                condition.apply(criteria.getNotes(), copy.getNotes()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getFromAccountId(), copy.getFromAccountId()) &&
                condition.apply(criteria.getToAccountId(), copy.getToAccountId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
