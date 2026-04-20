package com.finance.app.domain;

import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.InvoiceLineTestSamples.*;
import static com.finance.app.domain.InvoiceTestSamples.*;
import static com.finance.app.domain.PartyTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class InvoiceTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Invoice.class);
        Invoice invoice1 = getInvoiceSample1();
        Invoice invoice2 = new Invoice();
        assertThat(invoice1).isNotEqualTo(invoice2);

        invoice2.setId(invoice1.getId());
        assertThat(invoice1).isEqualTo(invoice2);

        invoice2 = getInvoiceSample2();
        assertThat(invoice1).isNotEqualTo(invoice2);
    }

    @Test
    void linesTest() {
        Invoice invoice = getInvoiceRandomSampleGenerator();
        InvoiceLine invoiceLineBack = getInvoiceLineRandomSampleGenerator();

        invoice.addLines(invoiceLineBack);
        assertThat(invoice.getLineses()).containsOnly(invoiceLineBack);
        assertThat(invoiceLineBack.getInvoice()).isEqualTo(invoice);

        invoice.removeLines(invoiceLineBack);
        assertThat(invoice.getLineses()).doesNotContain(invoiceLineBack);
        assertThat(invoiceLineBack.getInvoice()).isNull();

        invoice.lineses(new HashSet<>(Set.of(invoiceLineBack)));
        assertThat(invoice.getLineses()).containsOnly(invoiceLineBack);
        assertThat(invoiceLineBack.getInvoice()).isEqualTo(invoice);

        invoice.setLineses(new HashSet<>());
        assertThat(invoice.getLineses()).doesNotContain(invoiceLineBack);
        assertThat(invoiceLineBack.getInvoice()).isNull();
    }

    @Test
    void businessTest() {
        Invoice invoice = getInvoiceRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        invoice.setBusiness(businessBack);
        assertThat(invoice.getBusiness()).isEqualTo(businessBack);

        invoice.business(null);
        assertThat(invoice.getBusiness()).isNull();
    }

    @Test
    void partyTest() {
        Invoice invoice = getInvoiceRandomSampleGenerator();
        Party partyBack = getPartyRandomSampleGenerator();

        invoice.setParty(partyBack);
        assertThat(invoice.getParty()).isEqualTo(partyBack);

        invoice.party(null);
        assertThat(invoice.getParty()).isNull();
    }
}
