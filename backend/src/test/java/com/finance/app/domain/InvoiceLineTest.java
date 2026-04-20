package com.finance.app.domain;

import static com.finance.app.domain.InvoiceLineTestSamples.*;
import static com.finance.app.domain.InvoiceTestSamples.*;
import static com.finance.app.domain.ItemTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class InvoiceLineTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(InvoiceLine.class);
        InvoiceLine invoiceLine1 = getInvoiceLineSample1();
        InvoiceLine invoiceLine2 = new InvoiceLine();
        assertThat(invoiceLine1).isNotEqualTo(invoiceLine2);

        invoiceLine2.setId(invoiceLine1.getId());
        assertThat(invoiceLine1).isEqualTo(invoiceLine2);

        invoiceLine2 = getInvoiceLineSample2();
        assertThat(invoiceLine1).isNotEqualTo(invoiceLine2);
    }

    @Test
    void itemTest() {
        InvoiceLine invoiceLine = getInvoiceLineRandomSampleGenerator();
        Item itemBack = getItemRandomSampleGenerator();

        invoiceLine.setItem(itemBack);
        assertThat(invoiceLine.getItem()).isEqualTo(itemBack);

        invoiceLine.item(null);
        assertThat(invoiceLine.getItem()).isNull();
    }

    @Test
    void invoiceTest() {
        InvoiceLine invoiceLine = getInvoiceLineRandomSampleGenerator();
        Invoice invoiceBack = getInvoiceRandomSampleGenerator();

        invoiceLine.setInvoice(invoiceBack);
        assertThat(invoiceLine.getInvoice()).isEqualTo(invoiceBack);

        invoiceLine.invoice(null);
        assertThat(invoiceLine.getInvoice()).isNull();
    }
}
