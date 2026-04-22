package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class PurchaseCriteriaTest {

    @Test
    void newPurchaseCriteriaHasAllFiltersNullTest() {
        var purchaseCriteria = new PurchaseCriteria();
        assertThat(purchaseCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void purchaseCriteriaFluentMethodsCreatesFiltersTest() {
        var purchaseCriteria = new PurchaseCriteria();

        setAllFilters(purchaseCriteria);

        assertThat(purchaseCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void purchaseCriteriaCopyCreatesNullFilterTest() {
        var purchaseCriteria = new PurchaseCriteria();
        var copy = purchaseCriteria.copy();

        assertThat(purchaseCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(purchaseCriteria)
        );
    }

    @Test
    void purchaseCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var purchaseCriteria = new PurchaseCriteria();
        setAllFilters(purchaseCriteria);

        var copy = purchaseCriteria.copy();

        assertThat(purchaseCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(purchaseCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var purchaseCriteria = new PurchaseCriteria();

        assertThat(purchaseCriteria).hasToString("PurchaseCriteria{}");
    }

    private static void setAllFilters(PurchaseCriteria purchaseCriteria) {
        purchaseCriteria.id();
        purchaseCriteria.number();
        purchaseCriteria.date();
        purchaseCriteria.dueDate();
        purchaseCriteria.partyName();
        purchaseCriteria.partyState();
        purchaseCriteria.businessState();
        purchaseCriteria.subtotal();
        purchaseCriteria.itemDiscountTotal();
        purchaseCriteria.overallDiscountKind();
        purchaseCriteria.overallDiscountValue();
        purchaseCriteria.overallDiscountAmount();
        purchaseCriteria.taxableValue();
        purchaseCriteria.cgst();
        purchaseCriteria.sgst();
        purchaseCriteria.igst();
        purchaseCriteria.taxTotal();
        purchaseCriteria.total();
        purchaseCriteria.paidAmount();
        purchaseCriteria.status();
        purchaseCriteria.kind();
        purchaseCriteria.sourcePurchaseId();
        purchaseCriteria.notes();
        purchaseCriteria.terms();
        purchaseCriteria.finalizedAt();
        purchaseCriteria.deleted();
        purchaseCriteria.createdAt();
        purchaseCriteria.updatedAt();
        purchaseCriteria.linesId();
        purchaseCriteria.businessId();
        purchaseCriteria.partyId();
        purchaseCriteria.distinct();
    }

    private static Condition<PurchaseCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getNumber()) &&
                condition.apply(criteria.getDate()) &&
                condition.apply(criteria.getDueDate()) &&
                condition.apply(criteria.getPartyName()) &&
                condition.apply(criteria.getPartyState()) &&
                condition.apply(criteria.getBusinessState()) &&
                condition.apply(criteria.getSubtotal()) &&
                condition.apply(criteria.getItemDiscountTotal()) &&
                condition.apply(criteria.getOverallDiscountKind()) &&
                condition.apply(criteria.getOverallDiscountValue()) &&
                condition.apply(criteria.getOverallDiscountAmount()) &&
                condition.apply(criteria.getTaxableValue()) &&
                condition.apply(criteria.getCgst()) &&
                condition.apply(criteria.getSgst()) &&
                condition.apply(criteria.getIgst()) &&
                condition.apply(criteria.getTaxTotal()) &&
                condition.apply(criteria.getTotal()) &&
                condition.apply(criteria.getPaidAmount()) &&
                condition.apply(criteria.getStatus()) &&
                condition.apply(criteria.getKind()) &&
                condition.apply(criteria.getSourcePurchaseId()) &&
                condition.apply(criteria.getNotes()) &&
                condition.apply(criteria.getTerms()) &&
                condition.apply(criteria.getFinalizedAt()) &&
                condition.apply(criteria.getDeleted()) &&
                condition.apply(criteria.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt()) &&
                condition.apply(criteria.getLinesId()) &&
                condition.apply(criteria.getBusinessId()) &&
                condition.apply(criteria.getPartyId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<PurchaseCriteria> copyFiltersAre(PurchaseCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getNumber(), copy.getNumber()) &&
                condition.apply(criteria.getDate(), copy.getDate()) &&
                condition.apply(criteria.getDueDate(), copy.getDueDate()) &&
                condition.apply(criteria.getPartyName(), copy.getPartyName()) &&
                condition.apply(criteria.getPartyState(), copy.getPartyState()) &&
                condition.apply(criteria.getBusinessState(), copy.getBusinessState()) &&
                condition.apply(criteria.getSubtotal(), copy.getSubtotal()) &&
                condition.apply(criteria.getItemDiscountTotal(), copy.getItemDiscountTotal()) &&
                condition.apply(criteria.getOverallDiscountKind(), copy.getOverallDiscountKind()) &&
                condition.apply(criteria.getOverallDiscountValue(), copy.getOverallDiscountValue()) &&
                condition.apply(criteria.getOverallDiscountAmount(), copy.getOverallDiscountAmount()) &&
                condition.apply(criteria.getTaxableValue(), copy.getTaxableValue()) &&
                condition.apply(criteria.getCgst(), copy.getCgst()) &&
                condition.apply(criteria.getSgst(), copy.getSgst()) &&
                condition.apply(criteria.getIgst(), copy.getIgst()) &&
                condition.apply(criteria.getTaxTotal(), copy.getTaxTotal()) &&
                condition.apply(criteria.getTotal(), copy.getTotal()) &&
                condition.apply(criteria.getPaidAmount(), copy.getPaidAmount()) &&
                condition.apply(criteria.getStatus(), copy.getStatus()) &&
                condition.apply(criteria.getKind(), copy.getKind()) &&
                condition.apply(criteria.getSourcePurchaseId(), copy.getSourcePurchaseId()) &&
                condition.apply(criteria.getNotes(), copy.getNotes()) &&
                condition.apply(criteria.getTerms(), copy.getTerms()) &&
                condition.apply(criteria.getFinalizedAt(), copy.getFinalizedAt()) &&
                condition.apply(criteria.getDeleted(), copy.getDeleted()) &&
                condition.apply(criteria.getCreatedAt(), copy.getCreatedAt()) &&
                condition.apply(criteria.getUpdatedAt(), copy.getUpdatedAt()) &&
                condition.apply(criteria.getLinesId(), copy.getLinesId()) &&
                condition.apply(criteria.getBusinessId(), copy.getBusinessId()) &&
                condition.apply(criteria.getPartyId(), copy.getPartyId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
