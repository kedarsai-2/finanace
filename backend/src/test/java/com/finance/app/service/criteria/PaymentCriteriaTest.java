package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class PaymentCriteriaTest {

    @Test
    void newPaymentCriteriaHasAllFiltersNullTest() {
        var paymentCriteria = new PaymentCriteria();
        assertThat(paymentCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void paymentCriteriaFluentMethodsCreatesFiltersTest() {
        var paymentCriteria = new PaymentCriteria();

        setAllFilters(paymentCriteria);

        assertThat(paymentCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void paymentCriteriaCopyCreatesNullFilterTest() {
        var paymentCriteria = new PaymentCriteria();
        var copy = paymentCriteria.copy();

        assertThat(paymentCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(paymentCriteria)
        );
    }

    @Test
    void paymentCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var paymentCriteria = new PaymentCriteria();
        setAllFilters(paymentCriteria);

        var copy = paymentCriteria.copy();

        assertThat(paymentCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(paymentCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var paymentCriteria = new PaymentCriteria();

        assertThat(paymentCriteria).hasToString("PaymentCriteria{}");
    }

    private static void setAllFilters(PaymentCriteria paymentCriteria) {
        paymentCriteria.id();
        paymentCriteria.direction();
        paymentCriteria.date();
        paymentCriteria.amount();
        paymentCriteria.mode();
        paymentCriteria.reference();
        paymentCriteria.notes();
        paymentCriteria.createdAt();
        paymentCriteria.updatedAt();
        paymentCriteria.allocationsId();
        paymentCriteria.businessId();
        paymentCriteria.partyId();
        paymentCriteria.accountId();
        paymentCriteria.distinct();
    }

    private static Condition<PaymentCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getDirection()) &&
                condition.apply(criteria.getDate()) &&
                condition.apply(criteria.getAmount()) &&
                condition.apply(criteria.getMode()) &&
                condition.apply(criteria.getReference()) &&
                condition.apply(criteria.getNotes()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getAllocationsId()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getPartyId()) &&
                condition.apply(criteria.getAccountId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<PaymentCriteria> copyFiltersAre(PaymentCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getDirection(), copy.getDirection()) &&
                condition.apply(criteria.getDate(), copy.getDate()) &&
                condition.apply(criteria.getAmount(), copy.getAmount()) &&
                condition.apply(criteria.getMode(), copy.getMode()) &&
                condition.apply(criteria.getReference(), copy.getReference()) &&
                condition.apply(criteria.getNotes(), copy.getNotes()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getAllocationsId(), copy.getAllocationsId()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getPartyId(), copy.getPartyId()) &&
                condition.apply(criteria.getAccountId(), copy.getAccountId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
