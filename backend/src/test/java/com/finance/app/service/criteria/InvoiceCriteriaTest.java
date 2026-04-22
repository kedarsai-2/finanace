package com.finance.app.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class InvoiceCriteriaTest {

    @Test
    void newInvoiceCriteriaHasAllFiltersNullTest() {
        var invoiceCriteria = new InvoiceCriteria();
        assertThat(invoiceCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void invoiceCriteriaFluentMethodsCreatesFiltersTest() {
        var invoiceCriteria = new InvoiceCriteria();

        setAllFilters(invoiceCriteria);

        assertThat(invoiceCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void invoiceCriteriaCopyCreatesNullFilterTest() {
        var invoiceCriteria = new InvoiceCriteria();
        var copy = invoiceCriteria.copy();

        assertThat(invoiceCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(invoiceCriteria)
        );
    }

    @Test
    void invoiceCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var invoiceCriteria = new InvoiceCriteria();
        setAllFilters(invoiceCriteria);

        var copy = invoiceCriteria.copy();

        assertThat(invoiceCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(invoiceCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var invoiceCriteria = new InvoiceCriteria();

        assertThat(invoiceCriteria).hasToString("InvoiceCriteria{}");
    }

    private static void setAllFilters(InvoiceCriteria invoiceCriteria) {
        invoiceCriteria.id();
        invoiceCriteria.number();
        invoiceCriteria.date();
        invoiceCriteria.dueDate();
        invoiceCriteria.paymentTermsDays();
        invoiceCriteria.partyName();
        invoiceCriteria.partyState();
        invoiceCriteria.businessState();
        invoiceCriteria.subtotal();
        invoiceCriteria.itemDiscountTotal();
        invoiceCriteria.overallDiscountKind();
        invoiceCriteria.overallDiscountValue();
        invoiceCriteria.overallDiscountAmount();
        invoiceCriteria.taxableValue();
        invoiceCriteria.cgst();
        invoiceCriteria.sgst();
        invoiceCriteria.igst();
        invoiceCriteria.taxTotal();
        invoiceCriteria.total();
        invoiceCriteria.paidAmount();
        invoiceCriteria.status();
        invoiceCriteria.kind();
        invoiceCriteria.sourceInvoiceId();
        invoiceCriteria.notes();
        invoiceCriteria.terms();
        invoiceCriteria.finalizedAt();
        invoiceCriteria.deleted();
        invoiceCriteria.createdAt();
        invoiceCriteria.updatedAt();
        invoiceCriteria.linesId();
        invoiceCriteria.businessId();
        invoiceCriteria.partyId();
        invoiceCriteria.distinct();
    }

    private static Condition<InvoiceCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getNumber()) &&
                condition.apply(criteria.getDate()) &&
                condition.apply(criteria.getDueDate()) &&
                condition.apply(criteria.getPaymentTermsDays()) &&
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
                condition.apply(criteria.getSourceInvoiceId()) &&
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

    private static Condition<InvoiceCriteria> copyFiltersAre(InvoiceCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getNumber(), copy.getNumber()) &&
                condition.apply(criteria.getDate(), copy.getDate()) &&
                condition.apply(criteria.getDueDate(), copy.getDueDate()) &&
                condition.apply(criteria.getPaymentTermsDays(), copy.getPaymentTermsDays()) &&
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
                condition.apply(criteria.getSourceInvoiceId(), copy.getSourceInvoiceId()) &&
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
