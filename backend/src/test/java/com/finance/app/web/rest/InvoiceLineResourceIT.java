package com.finance.app.web.rest;

import static com.finance.app.domain.InvoiceLineAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Invoice;
import com.finance.app.domain.InvoiceLine;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.repository.InvoiceLineRepository;
import com.finance.app.service.InvoiceLineService;
import com.finance.app.service.dto.InvoiceLineDTO;
import com.finance.app.service.mapper.InvoiceLineMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link InvoiceLineResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class InvoiceLineResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_QTY = new BigDecimal(0);
    private static final BigDecimal UPDATED_QTY = new BigDecimal(1);

    private static final String DEFAULT_UNIT = "AAAAAAAAAA";
    private static final String UPDATED_UNIT = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_RATE = new BigDecimal(0);
    private static final BigDecimal UPDATED_RATE = new BigDecimal(1);

    private static final DiscountKind DEFAULT_DISCOUNT_KIND = DiscountKind.PERCENT;
    private static final DiscountKind UPDATED_DISCOUNT_KIND = DiscountKind.AMOUNT;

    private static final BigDecimal DEFAULT_DISCOUNT_VALUE = new BigDecimal(0);
    private static final BigDecimal UPDATED_DISCOUNT_VALUE = new BigDecimal(1);

    private static final BigDecimal DEFAULT_TAX_PERCENT = new BigDecimal(0);
    private static final BigDecimal UPDATED_TAX_PERCENT = new BigDecimal(1);

    private static final Integer DEFAULT_LINE_ORDER = 0;
    private static final Integer UPDATED_LINE_ORDER = 1;

    private static final String ENTITY_API_URL = "/api/invoice-lines";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private InvoiceLineRepository invoiceLineRepository;

    @Mock
    private InvoiceLineRepository invoiceLineRepositoryMock;

    @Autowired
    private InvoiceLineMapper invoiceLineMapper;

    @Mock
    private InvoiceLineService invoiceLineServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restInvoiceLineMockMvc;

    private InvoiceLine invoiceLine;

    private InvoiceLine insertedInvoiceLine;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static InvoiceLine createEntity(EntityManager em) {
        InvoiceLine invoiceLine = new InvoiceLine()
            .name(DEFAULT_NAME)
            .qty(DEFAULT_QTY)
            .unit(DEFAULT_UNIT)
            .rate(DEFAULT_RATE)
            .discountKind(DEFAULT_DISCOUNT_KIND)
            .discountValue(DEFAULT_DISCOUNT_VALUE)
            .taxPercent(DEFAULT_TAX_PERCENT)
            .lineOrder(DEFAULT_LINE_ORDER);
        // Add required entity
        Invoice invoice;
        if (TestUtil.findAll(em, Invoice.class).isEmpty()) {
            invoice = InvoiceResourceIT.createEntity();
            em.persist(invoice);
            em.flush();
        } else {
            invoice = TestUtil.findAll(em, Invoice.class).get(0);
        }
        invoiceLine.setInvoice(invoice);
        return invoiceLine;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static InvoiceLine createUpdatedEntity(EntityManager em) {
        InvoiceLine updatedInvoiceLine = new InvoiceLine()
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);
        // Add required entity
        Invoice invoice;
        if (TestUtil.findAll(em, Invoice.class).isEmpty()) {
            invoice = InvoiceResourceIT.createUpdatedEntity();
            em.persist(invoice);
            em.flush();
        } else {
            invoice = TestUtil.findAll(em, Invoice.class).get(0);
        }
        updatedInvoiceLine.setInvoice(invoice);
        return updatedInvoiceLine;
    }

    @BeforeEach
    void initTest() {
        invoiceLine = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedInvoiceLine != null) {
            invoiceLineRepository.delete(insertedInvoiceLine);
            insertedInvoiceLine = null;
        }
    }

    @Test
    @Transactional
    void createInvoiceLine() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);
        var returnedInvoiceLineDTO = om.readValue(
            restInvoiceLineMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            InvoiceLineDTO.class
        );

        // Validate the InvoiceLine in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedInvoiceLine = invoiceLineMapper.toEntity(returnedInvoiceLineDTO);
        assertInvoiceLineUpdatableFieldsEquals(returnedInvoiceLine, getPersistedInvoiceLine(returnedInvoiceLine));

        insertedInvoiceLine = returnedInvoiceLine;
    }

    @Test
    @Transactional
    void createInvoiceLineWithExistingId() throws Exception {
        // Create the InvoiceLine with an existing ID
        invoiceLine.setId(1L);
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setName(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkQtyIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setQty(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkUnitIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setUnit(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkRateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setRate(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDiscountKindIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setDiscountKind(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDiscountValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setDiscountValue(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxPercentIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoiceLine.setTaxPercent(null);

        // Create the InvoiceLine, which fails.
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        restInvoiceLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllInvoiceLines() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        // Get all the invoiceLineList
        restInvoiceLineMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(invoiceLine.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].qty").value(hasItem(sameNumber(DEFAULT_QTY))))
            .andExpect(jsonPath("$.[*].unit").value(hasItem(DEFAULT_UNIT)))
            .andExpect(jsonPath("$.[*].rate").value(hasItem(sameNumber(DEFAULT_RATE))))
            .andExpect(jsonPath("$.[*].discountKind").value(hasItem(DEFAULT_DISCOUNT_KIND.toString())))
            .andExpect(jsonPath("$.[*].discountValue").value(hasItem(sameNumber(DEFAULT_DISCOUNT_VALUE))))
            .andExpect(jsonPath("$.[*].taxPercent").value(hasItem(sameNumber(DEFAULT_TAX_PERCENT))))
            .andExpect(jsonPath("$.[*].lineOrder").value(hasItem(DEFAULT_LINE_ORDER)));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllInvoiceLinesWithEagerRelationshipsIsEnabled() throws Exception {
        when(invoiceLineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restInvoiceLineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(invoiceLineServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllInvoiceLinesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(invoiceLineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restInvoiceLineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(invoiceLineRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getInvoiceLine() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        // Get the invoiceLine
        restInvoiceLineMockMvc
            .perform(get(ENTITY_API_URL_ID, invoiceLine.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(invoiceLine.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.qty").value(sameNumber(DEFAULT_QTY)))
            .andExpect(jsonPath("$.unit").value(DEFAULT_UNIT))
            .andExpect(jsonPath("$.rate").value(sameNumber(DEFAULT_RATE)))
            .andExpect(jsonPath("$.discountKind").value(DEFAULT_DISCOUNT_KIND.toString()))
            .andExpect(jsonPath("$.discountValue").value(sameNumber(DEFAULT_DISCOUNT_VALUE)))
            .andExpect(jsonPath("$.taxPercent").value(sameNumber(DEFAULT_TAX_PERCENT)))
            .andExpect(jsonPath("$.lineOrder").value(DEFAULT_LINE_ORDER));
    }

    @Test
    @Transactional
    void getNonExistingInvoiceLine() throws Exception {
        // Get the invoiceLine
        restInvoiceLineMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingInvoiceLine() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoiceLine
        InvoiceLine updatedInvoiceLine = invoiceLineRepository.findById(invoiceLine.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedInvoiceLine are not directly saved in db
        em.detach(updatedInvoiceLine);
        updatedInvoiceLine
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(updatedInvoiceLine);

        restInvoiceLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, invoiceLineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(invoiceLineDTO))
            )
            .andExpect(status().isOk());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedInvoiceLineToMatchAllProperties(updatedInvoiceLine);
    }

    @Test
    @Transactional
    void putNonExistingInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, invoiceLineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(invoiceLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(invoiceLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateInvoiceLineWithPatch() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoiceLine using partial update
        InvoiceLine partialUpdatedInvoiceLine = new InvoiceLine();
        partialUpdatedInvoiceLine.setId(invoiceLine.getId());

        partialUpdatedInvoiceLine.qty(UPDATED_QTY).rate(UPDATED_RATE).taxPercent(UPDATED_TAX_PERCENT).lineOrder(UPDATED_LINE_ORDER);

        restInvoiceLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedInvoiceLine.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedInvoiceLine))
            )
            .andExpect(status().isOk());

        // Validate the InvoiceLine in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertInvoiceLineUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedInvoiceLine, invoiceLine),
            getPersistedInvoiceLine(invoiceLine)
        );
    }

    @Test
    @Transactional
    void fullUpdateInvoiceLineWithPatch() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoiceLine using partial update
        InvoiceLine partialUpdatedInvoiceLine = new InvoiceLine();
        partialUpdatedInvoiceLine.setId(invoiceLine.getId());

        partialUpdatedInvoiceLine
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);

        restInvoiceLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedInvoiceLine.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedInvoiceLine))
            )
            .andExpect(status().isOk());

        // Validate the InvoiceLine in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertInvoiceLineUpdatableFieldsEquals(partialUpdatedInvoiceLine, getPersistedInvoiceLine(partialUpdatedInvoiceLine));
    }

    @Test
    @Transactional
    void patchNonExistingInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, invoiceLineDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(invoiceLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(invoiceLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamInvoiceLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoiceLine.setId(longCount.incrementAndGet());

        // Create the InvoiceLine
        InvoiceLineDTO invoiceLineDTO = invoiceLineMapper.toDto(invoiceLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceLineMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(invoiceLineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the InvoiceLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteInvoiceLine() throws Exception {
        // Initialize the database
        insertedInvoiceLine = invoiceLineRepository.saveAndFlush(invoiceLine);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the invoiceLine
        restInvoiceLineMockMvc
            .perform(delete(ENTITY_API_URL_ID, invoiceLine.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return invoiceLineRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected InvoiceLine getPersistedInvoiceLine(InvoiceLine invoiceLine) {
        return invoiceLineRepository.findById(invoiceLine.getId()).orElseThrow();
    }

    protected void assertPersistedInvoiceLineToMatchAllProperties(InvoiceLine expectedInvoiceLine) {
        assertInvoiceLineAllPropertiesEquals(expectedInvoiceLine, getPersistedInvoiceLine(expectedInvoiceLine));
    }

    protected void assertPersistedInvoiceLineToMatchUpdatableProperties(InvoiceLine expectedInvoiceLine) {
        assertInvoiceLineAllUpdatablePropertiesEquals(expectedInvoiceLine, getPersistedInvoiceLine(expectedInvoiceLine));
    }
}
