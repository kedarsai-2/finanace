package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class AccountCriteriaTest {

    @Test
    void newAccountCriteriaHasAllFiltersNullTest() {
        var accountCriteria = new AccountCriteria();
        assertThat(accountCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void accountCriteriaFluentMethodsCreatesFiltersTest() {
        var accountCriteria = new AccountCriteria();

        setAllFilters(accountCriteria);

        assertThat(accountCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void accountCriteriaCopyCreatesNullFilterTest() {
        var accountCriteria = new AccountCriteria();
        var copy = accountCriteria.copy();

        assertThat(accountCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(accountCriteria)
        );
    }

    @Test
    void accountCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var accountCriteria = new AccountCriteria();
        setAllFilters(accountCriteria);

        var copy = accountCriteria.copy();

        assertThat(accountCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(accountCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var accountCriteria = new AccountCriteria();

        assertThat(accountCriteria).hasToString("AccountCriteria{}");
    }

    private static void setAllFilters(AccountCriteria accountCriteria) {
        accountCriteria.id();
        accountCriteria.name();
        accountCriteria.type();
        accountCriteria.openingBalance();
        accountCriteria.accountNumber();
        accountCriteria.ifsc();
        accountCriteria.upiId();
        accountCriteria.notes();
        accountCriteria.deleted();
        accountCriteria.createdAt();
        accountCriteria.updatedAt();
        accountCriteria.businessId();
        accountCriteria.distinct();
    }

    private static Condition<AccountCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getName()) &&
                condition.apply(criteria.getType()) &&
                condition.apply(criteria.getOpeningBalance()) &&
                condition.apply(criteria.getAccountNumber()) &&
                condition.apply(criteria.getIfsc()) &&
                condition.apply(criteria.getUpiId()) &&
                condition.apply(criteria.getNotes()) &&
                condition.apply(criteria.getDeleted()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<AccountCriteria> copyFiltersAre(AccountCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getName(), copy.getName()) &&
                condition.apply(criteria.getType(), copy.getType()) &&
                condition.apply(criteria.getOpeningBalance(), copy.getOpeningBalance()) &&
                condition.apply(criteria.getAccountNumber(), copy.getAccountNumber()) &&
                condition.apply(criteria.getIfsc(), copy.getIfsc()) &&
                condition.apply(criteria.getUpiId(), copy.getUpiId()) &&
                condition.apply(criteria.getNotes(), copy.getNotes()) &&
                condition.apply(criteria.getDeleted(), copy.getDeleted()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
