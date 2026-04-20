package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class PartyCriteriaTest {

    @Test
    void newPartyCriteriaHasAllFiltersNullTest() {
        var partyCriteria = new PartyCriteria();
        assertThat(partyCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void partyCriteriaFluentMethodsCreatesFiltersTest() {
        var partyCriteria = new PartyCriteria();

        setAllFilters(partyCriteria);

        assertThat(partyCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void partyCriteriaCopyCreatesNullFilterTest() {
        var partyCriteria = new PartyCriteria();
        var copy = partyCriteria.copy();

        assertThat(partyCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(partyCriteria)
        );
    }

    @Test
    void partyCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var partyCriteria = new PartyCriteria();
        setAllFilters(partyCriteria);

        var copy = partyCriteria.copy();

        assertThat(partyCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(partyCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var partyCriteria = new PartyCriteria();

        assertThat(partyCriteria).hasToString("PartyCriteria{}");
    }

    private static void setAllFilters(PartyCriteria partyCriteria) {
        partyCriteria.id();
        partyCriteria.name();
        partyCriteria.type();
        partyCriteria.mobile();
        partyCriteria.email();
        partyCriteria.addressLine1();
        partyCriteria.addressCity();
        partyCriteria.addressState();
        partyCriteria.addressPincode();
        partyCriteria.gstNumber();
        partyCriteria.panNumber();
        partyCriteria.creditLimit();
        partyCriteria.paymentTermsDays();
        partyCriteria.openingBalance();
        partyCriteria.balance();
        partyCriteria.createdAt();
        partyCriteria.updatedAt();
        partyCriteria.deleted();
        partyCriteria.businessId();
        partyCriteria.distinct();
    }

    private static Condition<PartyCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getName()) &&
                condition.apply(criteria.getType()) &&
                condition.apply(criteria.getMobile()) &&
                condition.apply(criteria.getEmail()) &&
                condition.apply(criteria.getAddressLine1()) &&
                condition.apply(criteria.getAddressCity()) &&
                condition.apply(criteria.getAddressState()) &&
                condition.apply(criteria.getAddressPincode()) &&
                condition.apply(criteria.getGstNumber()) &&
                condition.apply(criteria.getPanNumber()) &&
                condition.apply(criteria.getCreditLimit()) &&
                condition.apply(criteria.getPaymentTermsDays()) &&
                condition.apply(criteria.getOpeningBalance()) &&
                condition.apply(criteria.getBalance()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getDeleted()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<PartyCriteria> copyFiltersAre(PartyCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getName(), copy.getName()) &&
                condition.apply(criteria.getType(), copy.getType()) &&
                condition.apply(criteria.getMobile(), copy.getMobile()) &&
                condition.apply(criteria.getEmail(), copy.getEmail()) &&
                condition.apply(criteria.getAddressLine1(), copy.getAddressLine1()) &&
                condition.apply(criteria.getAddressCity(), copy.getAddressCity()) &&
                condition.apply(criteria.getAddressState(), copy.getAddressState()) &&
                condition.apply(criteria.getAddressPincode(), copy.getAddressPincode()) &&
                condition.apply(criteria.getGstNumber(), copy.getGstNumber()) &&
                condition.apply(criteria.getPanNumber(), copy.getPanNumber()) &&
                condition.apply(criteria.getCreditLimit(), copy.getCreditLimit()) &&
                condition.apply(criteria.getPaymentTermsDays(), copy.getPaymentTermsDays()) &&
                condition.apply(criteria.getOpeningBalance(), copy.getOpeningBalance()) &&
                condition.apply(criteria.getBalance(), copy.getBalance()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getDeleted(), copy.getDeleted()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
