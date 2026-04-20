package com.finance.app.web.rest;

import static com.finance.app.domain.InvoiceAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Business;
import com.finance.app.domain.Invoice;
import com.finance.app.domain.Party;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.InvoiceStatus;
import com.finance.app.repository.InvoiceRepository;
import com.finance.app.service.InvoiceService;
import com.finance.app.service.dto.InvoiceDTO;
import com.finance.app.service.mapper.InvoiceMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * Integration tests for the {@link InvoiceResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class InvoiceResourceIT {

    private static final String DEFAULT_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_NUMBER = "BBBBBBBBBB";

    private static final Instant DEFAULT_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_DUE_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DUE_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Integer DEFAULT_PAYMENT_TERMS_DAYS = 0;
    private static final Integer UPDATED_PAYMENT_TERMS_DAYS = 1;
    private static final Integer SMALLER_PAYMENT_TERMS_DAYS = 0 - 1;

    private static final String DEFAULT_PARTY_NAME = "AAAAAAAAAA";
    private static final String UPDATED_PARTY_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_PARTY_STATE = "AAAAAAAAAA";
    private static final String UPDATED_PARTY_STATE = "BBBBBBBBBB";

    private static final String DEFAULT_BUSINESS_STATE = "AAAAAAAAAA";
    private static final String UPDATED_BUSINESS_STATE = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_SUBTOTAL = new BigDecimal(0);
    private static final BigDecimal UPDATED_SUBTOTAL = new BigDecimal(1);
    private static final BigDecimal SMALLER_SUBTOTAL = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_ITEM_DISCOUNT_TOTAL = new BigDecimal(0);
    private static final BigDecimal UPDATED_ITEM_DISCOUNT_TOTAL = new BigDecimal(1);
    private static final BigDecimal SMALLER_ITEM_DISCOUNT_TOTAL = new BigDecimal(0 - 1);

    private static final DiscountKind DEFAULT_OVERALL_DISCOUNT_KIND = DiscountKind.PERCENT;
    private static final DiscountKind UPDATED_OVERALL_DISCOUNT_KIND = DiscountKind.AMOUNT;

    private static final BigDecimal DEFAULT_OVERALL_DISCOUNT_VALUE = new BigDecimal(0);
    private static final BigDecimal UPDATED_OVERALL_DISCOUNT_VALUE = new BigDecimal(1);
    private static final BigDecimal SMALLER_OVERALL_DISCOUNT_VALUE = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_OVERALL_DISCOUNT_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_OVERALL_DISCOUNT_AMOUNT = new BigDecimal(1);
    private static final BigDecimal SMALLER_OVERALL_DISCOUNT_AMOUNT = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_TAXABLE_VALUE = new BigDecimal(0);
    private static final BigDecimal UPDATED_TAXABLE_VALUE = new BigDecimal(1);
    private static final BigDecimal SMALLER_TAXABLE_VALUE = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_CGST = new BigDecimal(0);
    private static final BigDecimal UPDATED_CGST = new BigDecimal(1);
    private static final BigDecimal SMALLER_CGST = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_SGST = new BigDecimal(0);
    private static final BigDecimal UPDATED_SGST = new BigDecimal(1);
    private static final BigDecimal SMALLER_SGST = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_IGST = new BigDecimal(0);
    private static final BigDecimal UPDATED_IGST = new BigDecimal(1);
    private static final BigDecimal SMALLER_IGST = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_TAX_TOTAL = new BigDecimal(0);
    private static final BigDecimal UPDATED_TAX_TOTAL = new BigDecimal(1);
    private static final BigDecimal SMALLER_TAX_TOTAL = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_TOTAL = new BigDecimal(0);
    private static final BigDecimal UPDATED_TOTAL = new BigDecimal(1);
    private static final BigDecimal SMALLER_TOTAL = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_PAID_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_PAID_AMOUNT = new BigDecimal(1);
    private static final BigDecimal SMALLER_PAID_AMOUNT = new BigDecimal(0 - 1);

    private static final InvoiceStatus DEFAULT_STATUS = InvoiceStatus.DRAFT;
    private static final InvoiceStatus UPDATED_STATUS = InvoiceStatus.FINAL;

    private static final String DEFAULT_NOTES = "AAAAAAAAAA";
    private static final String UPDATED_NOTES = "BBBBBBBBBB";

    private static final String DEFAULT_TERMS = "AAAAAAAAAA";
    private static final String UPDATED_TERMS = "BBBBBBBBBB";

    private static final Instant DEFAULT_FINALIZED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_FINALIZED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/invoices";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceRepository invoiceRepositoryMock;

    @Autowired
    private InvoiceMapper invoiceMapper;

    @Mock
    private InvoiceService invoiceServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restInvoiceMockMvc;

    private Invoice invoice;

    private Invoice insertedInvoice;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Invoice createEntity() {
        return new Invoice()
            .number(DEFAULT_NUMBER)
            .date(DEFAULT_DATE)
            .dueDate(DEFAULT_DUE_DATE)
            .paymentTermsDays(DEFAULT_PAYMENT_TERMS_DAYS)
            .partyName(DEFAULT_PARTY_NAME)
            .partyState(DEFAULT_PARTY_STATE)
            .businessState(DEFAULT_BUSINESS_STATE)
            .subtotal(DEFAULT_SUBTOTAL)
            .itemDiscountTotal(DEFAULT_ITEM_DISCOUNT_TOTAL)
            .overallDiscountKind(DEFAULT_OVERALL_DISCOUNT_KIND)
            .overallDiscountValue(DEFAULT_OVERALL_DISCOUNT_VALUE)
            .overallDiscountAmount(DEFAULT_OVERALL_DISCOUNT_AMOUNT)
            .taxableValue(DEFAULT_TAXABLE_VALUE)
            .cgst(DEFAULT_CGST)
            .sgst(DEFAULT_SGST)
            .igst(DEFAULT_IGST)
            .taxTotal(DEFAULT_TAX_TOTAL)
            .total(DEFAULT_TOTAL)
            .paidAmount(DEFAULT_PAID_AMOUNT)
            .status(DEFAULT_STATUS)
            .notes(DEFAULT_NOTES)
            .terms(DEFAULT_TERMS)
            .finalizedAt(DEFAULT_FINALIZED_AT)
            .deleted(DEFAULT_DELETED)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Invoice createUpdatedEntity() {
        return new Invoice()
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .partyName(UPDATED_PARTY_NAME)
            .partyState(UPDATED_PARTY_STATE)
            .businessState(UPDATED_BUSINESS_STATE)
            .subtotal(UPDATED_SUBTOTAL)
            .itemDiscountTotal(UPDATED_ITEM_DISCOUNT_TOTAL)
            .overallDiscountKind(UPDATED_OVERALL_DISCOUNT_KIND)
            .overallDiscountValue(UPDATED_OVERALL_DISCOUNT_VALUE)
            .overallDiscountAmount(UPDATED_OVERALL_DISCOUNT_AMOUNT)
            .taxableValue(UPDATED_TAXABLE_VALUE)
            .cgst(UPDATED_CGST)
            .sgst(UPDATED_SGST)
            .igst(UPDATED_IGST)
            .taxTotal(UPDATED_TAX_TOTAL)
            .total(UPDATED_TOTAL)
            .paidAmount(UPDATED_PAID_AMOUNT)
            .status(UPDATED_STATUS)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        invoice = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedInvoice != null) {
            invoiceRepository.delete(insertedInvoice);
            insertedInvoice = null;
        }
    }

    @Test
    @Transactional
    void createInvoice() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);
        var returnedInvoiceDTO = om.readValue(
            restInvoiceMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            InvoiceDTO.class
        );

        // Validate the Invoice in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedInvoice = invoiceMapper.toEntity(returnedInvoiceDTO);
        assertInvoiceUpdatableFieldsEquals(returnedInvoice, getPersistedInvoice(returnedInvoice));

        insertedInvoice = returnedInvoice;
    }

    @Test
    @Transactional
    void createInvoiceWithExistingId() throws Exception {
        // Create the Invoice with an existing ID
        invoice.setId(1L);
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNumberIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setNumber(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setDate(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkPartyNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setPartyName(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSubtotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setSubtotal(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkItemDiscountTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setItemDiscountTotal(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountKindIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setOverallDiscountKind(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setOverallDiscountValue(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setOverallDiscountAmount(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxableValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setTaxableValue(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setCgst(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setSgst(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkIgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setIgst(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setTaxTotal(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setTotal(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkPaidAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setPaidAmount(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkStatusIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setStatus(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        invoice.setCreatedAt(null);

        // Create the Invoice, which fails.
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        restInvoiceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllInvoices() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(invoice.getId().intValue())))
            .andExpect(jsonPath("$.[*].number").value(hasItem(DEFAULT_NUMBER)))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
            .andExpect(jsonPath("$.[*].paymentTermsDays").value(hasItem(DEFAULT_PAYMENT_TERMS_DAYS)))
            .andExpect(jsonPath("$.[*].partyName").value(hasItem(DEFAULT_PARTY_NAME)))
            .andExpect(jsonPath("$.[*].partyState").value(hasItem(DEFAULT_PARTY_STATE)))
            .andExpect(jsonPath("$.[*].businessState").value(hasItem(DEFAULT_BUSINESS_STATE)))
            .andExpect(jsonPath("$.[*].subtotal").value(hasItem(sameNumber(DEFAULT_SUBTOTAL))))
            .andExpect(jsonPath("$.[*].itemDiscountTotal").value(hasItem(sameNumber(DEFAULT_ITEM_DISCOUNT_TOTAL))))
            .andExpect(jsonPath("$.[*].overallDiscountKind").value(hasItem(DEFAULT_OVERALL_DISCOUNT_KIND.toString())))
            .andExpect(jsonPath("$.[*].overallDiscountValue").value(hasItem(sameNumber(DEFAULT_OVERALL_DISCOUNT_VALUE))))
            .andExpect(jsonPath("$.[*].overallDiscountAmount").value(hasItem(sameNumber(DEFAULT_OVERALL_DISCOUNT_AMOUNT))))
            .andExpect(jsonPath("$.[*].taxableValue").value(hasItem(sameNumber(DEFAULT_TAXABLE_VALUE))))
            .andExpect(jsonPath("$.[*].cgst").value(hasItem(sameNumber(DEFAULT_CGST))))
            .andExpect(jsonPath("$.[*].sgst").value(hasItem(sameNumber(DEFAULT_SGST))))
            .andExpect(jsonPath("$.[*].igst").value(hasItem(sameNumber(DEFAULT_IGST))))
            .andExpect(jsonPath("$.[*].taxTotal").value(hasItem(sameNumber(DEFAULT_TAX_TOTAL))))
            .andExpect(jsonPath("$.[*].total").value(hasItem(sameNumber(DEFAULT_TOTAL))))
            .andExpect(jsonPath("$.[*].paidAmount").value(hasItem(sameNumber(DEFAULT_PAID_AMOUNT))))
            .andExpect(jsonPath("$.[*].status").value(hasItem(DEFAULT_STATUS.toString())))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].terms").value(hasItem(DEFAULT_TERMS)))
            .andExpect(jsonPath("$.[*].finalizedAt").value(hasItem(DEFAULT_FINALIZED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllInvoicesWithEagerRelationshipsIsEnabled() throws Exception {
        when(invoiceServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restInvoiceMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(invoiceServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllInvoicesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(invoiceServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restInvoiceMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(invoiceRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getInvoice() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get the invoice
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL_ID, invoice.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(invoice.getId().intValue()))
            .andExpect(jsonPath("$.number").value(DEFAULT_NUMBER))
            .andExpect(jsonPath("$.date").value(DEFAULT_DATE.toString()))
            .andExpect(jsonPath("$.dueDate").value(DEFAULT_DUE_DATE.toString()))
            .andExpect(jsonPath("$.paymentTermsDays").value(DEFAULT_PAYMENT_TERMS_DAYS))
            .andExpect(jsonPath("$.partyName").value(DEFAULT_PARTY_NAME))
            .andExpect(jsonPath("$.partyState").value(DEFAULT_PARTY_STATE))
            .andExpect(jsonPath("$.businessState").value(DEFAULT_BUSINESS_STATE))
            .andExpect(jsonPath("$.subtotal").value(sameNumber(DEFAULT_SUBTOTAL)))
            .andExpect(jsonPath("$.itemDiscountTotal").value(sameNumber(DEFAULT_ITEM_DISCOUNT_TOTAL)))
            .andExpect(jsonPath("$.overallDiscountKind").value(DEFAULT_OVERALL_DISCOUNT_KIND.toString()))
            .andExpect(jsonPath("$.overallDiscountValue").value(sameNumber(DEFAULT_OVERALL_DISCOUNT_VALUE)))
            .andExpect(jsonPath("$.overallDiscountAmount").value(sameNumber(DEFAULT_OVERALL_DISCOUNT_AMOUNT)))
            .andExpect(jsonPath("$.taxableValue").value(sameNumber(DEFAULT_TAXABLE_VALUE)))
            .andExpect(jsonPath("$.cgst").value(sameNumber(DEFAULT_CGST)))
            .andExpect(jsonPath("$.sgst").value(sameNumber(DEFAULT_SGST)))
            .andExpect(jsonPath("$.igst").value(sameNumber(DEFAULT_IGST)))
            .andExpect(jsonPath("$.taxTotal").value(sameNumber(DEFAULT_TAX_TOTAL)))
            .andExpect(jsonPath("$.total").value(sameNumber(DEFAULT_TOTAL)))
            .andExpect(jsonPath("$.paidAmount").value(sameNumber(DEFAULT_PAID_AMOUNT)))
            .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.terms").value(DEFAULT_TERMS))
            .andExpect(jsonPath("$.finalizedAt").value(DEFAULT_FINALIZED_AT.toString()))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getInvoicesByIdFiltering() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        Long id = invoice.getId();

        defaultInvoiceFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultInvoiceFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultInvoiceFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllInvoicesByNumberIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where number equals to
        defaultInvoiceFiltering("number.equals=" + DEFAULT_NUMBER, "number.equals=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllInvoicesByNumberIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where number in
        defaultInvoiceFiltering("number.in=" + DEFAULT_NUMBER + "," + UPDATED_NUMBER, "number.in=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllInvoicesByNumberIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where number is not null
        defaultInvoiceFiltering("number.specified=true", "number.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByNumberContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where number contains
        defaultInvoiceFiltering("number.contains=" + DEFAULT_NUMBER, "number.contains=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllInvoicesByNumberNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where number does not contain
        defaultInvoiceFiltering("number.doesNotContain=" + UPDATED_NUMBER, "number.doesNotContain=" + DEFAULT_NUMBER);
    }

    @Test
    @Transactional
    void getAllInvoicesByDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where date equals to
        defaultInvoiceFiltering("date.equals=" + DEFAULT_DATE, "date.equals=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where date in
        defaultInvoiceFiltering("date.in=" + DEFAULT_DATE + "," + UPDATED_DATE, "date.in=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where date is not null
        defaultInvoiceFiltering("date.specified=true", "date.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByDueDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where dueDate equals to
        defaultInvoiceFiltering("dueDate.equals=" + DEFAULT_DUE_DATE, "dueDate.equals=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByDueDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where dueDate in
        defaultInvoiceFiltering("dueDate.in=" + DEFAULT_DUE_DATE + "," + UPDATED_DUE_DATE, "dueDate.in=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByDueDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where dueDate is not null
        defaultInvoiceFiltering("dueDate.specified=true", "dueDate.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays equals to
        defaultInvoiceFiltering(
            "paymentTermsDays.equals=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.equals=" + UPDATED_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays in
        defaultInvoiceFiltering(
            "paymentTermsDays.in=" + DEFAULT_PAYMENT_TERMS_DAYS + "," + UPDATED_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.in=" + UPDATED_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays is not null
        defaultInvoiceFiltering("paymentTermsDays.specified=true", "paymentTermsDays.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays is greater than or equal to
        defaultInvoiceFiltering(
            "paymentTermsDays.greaterThanOrEqual=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.greaterThanOrEqual=" + (DEFAULT_PAYMENT_TERMS_DAYS + 1)
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays is less than or equal to
        defaultInvoiceFiltering(
            "paymentTermsDays.lessThanOrEqual=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.lessThanOrEqual=" + SMALLER_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays is less than
        defaultInvoiceFiltering(
            "paymentTermsDays.lessThan=" + (DEFAULT_PAYMENT_TERMS_DAYS + 1),
            "paymentTermsDays.lessThan=" + DEFAULT_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaymentTermsDaysIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paymentTermsDays is greater than
        defaultInvoiceFiltering(
            "paymentTermsDays.greaterThan=" + SMALLER_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.greaterThan=" + DEFAULT_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyNameIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyName equals to
        defaultInvoiceFiltering("partyName.equals=" + DEFAULT_PARTY_NAME, "partyName.equals=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyNameIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyName in
        defaultInvoiceFiltering("partyName.in=" + DEFAULT_PARTY_NAME + "," + UPDATED_PARTY_NAME, "partyName.in=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyNameIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyName is not null
        defaultInvoiceFiltering("partyName.specified=true", "partyName.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyNameContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyName contains
        defaultInvoiceFiltering("partyName.contains=" + DEFAULT_PARTY_NAME, "partyName.contains=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyNameNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyName does not contain
        defaultInvoiceFiltering("partyName.doesNotContain=" + UPDATED_PARTY_NAME, "partyName.doesNotContain=" + DEFAULT_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyStateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyState equals to
        defaultInvoiceFiltering("partyState.equals=" + DEFAULT_PARTY_STATE, "partyState.equals=" + UPDATED_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyStateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyState in
        defaultInvoiceFiltering("partyState.in=" + DEFAULT_PARTY_STATE + "," + UPDATED_PARTY_STATE, "partyState.in=" + UPDATED_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyStateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyState is not null
        defaultInvoiceFiltering("partyState.specified=true", "partyState.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyStateContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyState contains
        defaultInvoiceFiltering("partyState.contains=" + DEFAULT_PARTY_STATE, "partyState.contains=" + UPDATED_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyStateNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where partyState does not contain
        defaultInvoiceFiltering("partyState.doesNotContain=" + UPDATED_PARTY_STATE, "partyState.doesNotContain=" + DEFAULT_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessStateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where businessState equals to
        defaultInvoiceFiltering("businessState.equals=" + DEFAULT_BUSINESS_STATE, "businessState.equals=" + UPDATED_BUSINESS_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessStateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where businessState in
        defaultInvoiceFiltering(
            "businessState.in=" + DEFAULT_BUSINESS_STATE + "," + UPDATED_BUSINESS_STATE,
            "businessState.in=" + UPDATED_BUSINESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessStateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where businessState is not null
        defaultInvoiceFiltering("businessState.specified=true", "businessState.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessStateContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where businessState contains
        defaultInvoiceFiltering("businessState.contains=" + DEFAULT_BUSINESS_STATE, "businessState.contains=" + UPDATED_BUSINESS_STATE);
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessStateNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where businessState does not contain
        defaultInvoiceFiltering(
            "businessState.doesNotContain=" + UPDATED_BUSINESS_STATE,
            "businessState.doesNotContain=" + DEFAULT_BUSINESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal equals to
        defaultInvoiceFiltering("subtotal.equals=" + DEFAULT_SUBTOTAL, "subtotal.equals=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal in
        defaultInvoiceFiltering("subtotal.in=" + DEFAULT_SUBTOTAL + "," + UPDATED_SUBTOTAL, "subtotal.in=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal is not null
        defaultInvoiceFiltering("subtotal.specified=true", "subtotal.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal is greater than or equal to
        defaultInvoiceFiltering("subtotal.greaterThanOrEqual=" + DEFAULT_SUBTOTAL, "subtotal.greaterThanOrEqual=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal is less than or equal to
        defaultInvoiceFiltering("subtotal.lessThanOrEqual=" + DEFAULT_SUBTOTAL, "subtotal.lessThanOrEqual=" + SMALLER_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal is less than
        defaultInvoiceFiltering("subtotal.lessThan=" + UPDATED_SUBTOTAL, "subtotal.lessThan=" + DEFAULT_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesBySubtotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where subtotal is greater than
        defaultInvoiceFiltering("subtotal.greaterThan=" + SMALLER_SUBTOTAL, "subtotal.greaterThan=" + DEFAULT_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal equals to
        defaultInvoiceFiltering(
            "itemDiscountTotal.equals=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.equals=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal in
        defaultInvoiceFiltering(
            "itemDiscountTotal.in=" + DEFAULT_ITEM_DISCOUNT_TOTAL + "," + UPDATED_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.in=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal is not null
        defaultInvoiceFiltering("itemDiscountTotal.specified=true", "itemDiscountTotal.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal is greater than or equal to
        defaultInvoiceFiltering(
            "itemDiscountTotal.greaterThanOrEqual=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.greaterThanOrEqual=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal is less than or equal to
        defaultInvoiceFiltering(
            "itemDiscountTotal.lessThanOrEqual=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.lessThanOrEqual=" + SMALLER_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal is less than
        defaultInvoiceFiltering(
            "itemDiscountTotal.lessThan=" + UPDATED_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.lessThan=" + DEFAULT_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByItemDiscountTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where itemDiscountTotal is greater than
        defaultInvoiceFiltering(
            "itemDiscountTotal.greaterThan=" + SMALLER_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.greaterThan=" + DEFAULT_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountKindIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountKind equals to
        defaultInvoiceFiltering(
            "overallDiscountKind.equals=" + DEFAULT_OVERALL_DISCOUNT_KIND,
            "overallDiscountKind.equals=" + UPDATED_OVERALL_DISCOUNT_KIND
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountKindIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountKind in
        defaultInvoiceFiltering(
            "overallDiscountKind.in=" + DEFAULT_OVERALL_DISCOUNT_KIND + "," + UPDATED_OVERALL_DISCOUNT_KIND,
            "overallDiscountKind.in=" + UPDATED_OVERALL_DISCOUNT_KIND
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountKindIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountKind is not null
        defaultInvoiceFiltering("overallDiscountKind.specified=true", "overallDiscountKind.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue equals to
        defaultInvoiceFiltering(
            "overallDiscountValue.equals=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.equals=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue in
        defaultInvoiceFiltering(
            "overallDiscountValue.in=" + DEFAULT_OVERALL_DISCOUNT_VALUE + "," + UPDATED_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.in=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue is not null
        defaultInvoiceFiltering("overallDiscountValue.specified=true", "overallDiscountValue.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue is greater than or equal to
        defaultInvoiceFiltering(
            "overallDiscountValue.greaterThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.greaterThanOrEqual=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue is less than or equal to
        defaultInvoiceFiltering(
            "overallDiscountValue.lessThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.lessThanOrEqual=" + SMALLER_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue is less than
        defaultInvoiceFiltering(
            "overallDiscountValue.lessThan=" + UPDATED_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.lessThan=" + DEFAULT_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountValueIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountValue is greater than
        defaultInvoiceFiltering(
            "overallDiscountValue.greaterThan=" + SMALLER_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.greaterThan=" + DEFAULT_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount equals to
        defaultInvoiceFiltering(
            "overallDiscountAmount.equals=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.equals=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount in
        defaultInvoiceFiltering(
            "overallDiscountAmount.in=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT + "," + UPDATED_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.in=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount is not null
        defaultInvoiceFiltering("overallDiscountAmount.specified=true", "overallDiscountAmount.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount is greater than or equal to
        defaultInvoiceFiltering(
            "overallDiscountAmount.greaterThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.greaterThanOrEqual=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount is less than or equal to
        defaultInvoiceFiltering(
            "overallDiscountAmount.lessThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.lessThanOrEqual=" + SMALLER_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount is less than
        defaultInvoiceFiltering(
            "overallDiscountAmount.lessThan=" + UPDATED_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.lessThan=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByOverallDiscountAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where overallDiscountAmount is greater than
        defaultInvoiceFiltering(
            "overallDiscountAmount.greaterThan=" + SMALLER_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.greaterThan=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue equals to
        defaultInvoiceFiltering("taxableValue.equals=" + DEFAULT_TAXABLE_VALUE, "taxableValue.equals=" + UPDATED_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue in
        defaultInvoiceFiltering(
            "taxableValue.in=" + DEFAULT_TAXABLE_VALUE + "," + UPDATED_TAXABLE_VALUE,
            "taxableValue.in=" + UPDATED_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue is not null
        defaultInvoiceFiltering("taxableValue.specified=true", "taxableValue.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue is greater than or equal to
        defaultInvoiceFiltering(
            "taxableValue.greaterThanOrEqual=" + DEFAULT_TAXABLE_VALUE,
            "taxableValue.greaterThanOrEqual=" + UPDATED_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue is less than or equal to
        defaultInvoiceFiltering(
            "taxableValue.lessThanOrEqual=" + DEFAULT_TAXABLE_VALUE,
            "taxableValue.lessThanOrEqual=" + SMALLER_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue is less than
        defaultInvoiceFiltering("taxableValue.lessThan=" + UPDATED_TAXABLE_VALUE, "taxableValue.lessThan=" + DEFAULT_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxableValueIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxableValue is greater than
        defaultInvoiceFiltering("taxableValue.greaterThan=" + SMALLER_TAXABLE_VALUE, "taxableValue.greaterThan=" + DEFAULT_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst equals to
        defaultInvoiceFiltering("cgst.equals=" + DEFAULT_CGST, "cgst.equals=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst in
        defaultInvoiceFiltering("cgst.in=" + DEFAULT_CGST + "," + UPDATED_CGST, "cgst.in=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst is not null
        defaultInvoiceFiltering("cgst.specified=true", "cgst.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst is greater than or equal to
        defaultInvoiceFiltering("cgst.greaterThanOrEqual=" + DEFAULT_CGST, "cgst.greaterThanOrEqual=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst is less than or equal to
        defaultInvoiceFiltering("cgst.lessThanOrEqual=" + DEFAULT_CGST, "cgst.lessThanOrEqual=" + SMALLER_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst is less than
        defaultInvoiceFiltering("cgst.lessThan=" + UPDATED_CGST, "cgst.lessThan=" + DEFAULT_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByCgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where cgst is greater than
        defaultInvoiceFiltering("cgst.greaterThan=" + SMALLER_CGST, "cgst.greaterThan=" + DEFAULT_CGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst equals to
        defaultInvoiceFiltering("sgst.equals=" + DEFAULT_SGST, "sgst.equals=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst in
        defaultInvoiceFiltering("sgst.in=" + DEFAULT_SGST + "," + UPDATED_SGST, "sgst.in=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst is not null
        defaultInvoiceFiltering("sgst.specified=true", "sgst.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst is greater than or equal to
        defaultInvoiceFiltering("sgst.greaterThanOrEqual=" + DEFAULT_SGST, "sgst.greaterThanOrEqual=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst is less than or equal to
        defaultInvoiceFiltering("sgst.lessThanOrEqual=" + DEFAULT_SGST, "sgst.lessThanOrEqual=" + SMALLER_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst is less than
        defaultInvoiceFiltering("sgst.lessThan=" + UPDATED_SGST, "sgst.lessThan=" + DEFAULT_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesBySgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where sgst is greater than
        defaultInvoiceFiltering("sgst.greaterThan=" + SMALLER_SGST, "sgst.greaterThan=" + DEFAULT_SGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst equals to
        defaultInvoiceFiltering("igst.equals=" + DEFAULT_IGST, "igst.equals=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst in
        defaultInvoiceFiltering("igst.in=" + DEFAULT_IGST + "," + UPDATED_IGST, "igst.in=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst is not null
        defaultInvoiceFiltering("igst.specified=true", "igst.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst is greater than or equal to
        defaultInvoiceFiltering("igst.greaterThanOrEqual=" + DEFAULT_IGST, "igst.greaterThanOrEqual=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst is less than or equal to
        defaultInvoiceFiltering("igst.lessThanOrEqual=" + DEFAULT_IGST, "igst.lessThanOrEqual=" + SMALLER_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst is less than
        defaultInvoiceFiltering("igst.lessThan=" + UPDATED_IGST, "igst.lessThan=" + DEFAULT_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByIgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where igst is greater than
        defaultInvoiceFiltering("igst.greaterThan=" + SMALLER_IGST, "igst.greaterThan=" + DEFAULT_IGST);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal equals to
        defaultInvoiceFiltering("taxTotal.equals=" + DEFAULT_TAX_TOTAL, "taxTotal.equals=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal in
        defaultInvoiceFiltering("taxTotal.in=" + DEFAULT_TAX_TOTAL + "," + UPDATED_TAX_TOTAL, "taxTotal.in=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal is not null
        defaultInvoiceFiltering("taxTotal.specified=true", "taxTotal.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal is greater than or equal to
        defaultInvoiceFiltering("taxTotal.greaterThanOrEqual=" + DEFAULT_TAX_TOTAL, "taxTotal.greaterThanOrEqual=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal is less than or equal to
        defaultInvoiceFiltering("taxTotal.lessThanOrEqual=" + DEFAULT_TAX_TOTAL, "taxTotal.lessThanOrEqual=" + SMALLER_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal is less than
        defaultInvoiceFiltering("taxTotal.lessThan=" + UPDATED_TAX_TOTAL, "taxTotal.lessThan=" + DEFAULT_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTaxTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where taxTotal is greater than
        defaultInvoiceFiltering("taxTotal.greaterThan=" + SMALLER_TAX_TOTAL, "taxTotal.greaterThan=" + DEFAULT_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total equals to
        defaultInvoiceFiltering("total.equals=" + DEFAULT_TOTAL, "total.equals=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total in
        defaultInvoiceFiltering("total.in=" + DEFAULT_TOTAL + "," + UPDATED_TOTAL, "total.in=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total is not null
        defaultInvoiceFiltering("total.specified=true", "total.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total is greater than or equal to
        defaultInvoiceFiltering("total.greaterThanOrEqual=" + DEFAULT_TOTAL, "total.greaterThanOrEqual=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total is less than or equal to
        defaultInvoiceFiltering("total.lessThanOrEqual=" + DEFAULT_TOTAL, "total.lessThanOrEqual=" + SMALLER_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total is less than
        defaultInvoiceFiltering("total.lessThan=" + UPDATED_TOTAL, "total.lessThan=" + DEFAULT_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where total is greater than
        defaultInvoiceFiltering("total.greaterThan=" + SMALLER_TOTAL, "total.greaterThan=" + DEFAULT_TOTAL);
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount equals to
        defaultInvoiceFiltering("paidAmount.equals=" + DEFAULT_PAID_AMOUNT, "paidAmount.equals=" + UPDATED_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount in
        defaultInvoiceFiltering("paidAmount.in=" + DEFAULT_PAID_AMOUNT + "," + UPDATED_PAID_AMOUNT, "paidAmount.in=" + UPDATED_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount is not null
        defaultInvoiceFiltering("paidAmount.specified=true", "paidAmount.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount is greater than or equal to
        defaultInvoiceFiltering(
            "paidAmount.greaterThanOrEqual=" + DEFAULT_PAID_AMOUNT,
            "paidAmount.greaterThanOrEqual=" + UPDATED_PAID_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount is less than or equal to
        defaultInvoiceFiltering("paidAmount.lessThanOrEqual=" + DEFAULT_PAID_AMOUNT, "paidAmount.lessThanOrEqual=" + SMALLER_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount is less than
        defaultInvoiceFiltering("paidAmount.lessThan=" + UPDATED_PAID_AMOUNT, "paidAmount.lessThan=" + DEFAULT_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllInvoicesByPaidAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where paidAmount is greater than
        defaultInvoiceFiltering("paidAmount.greaterThan=" + SMALLER_PAID_AMOUNT, "paidAmount.greaterThan=" + DEFAULT_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllInvoicesByStatusIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where status equals to
        defaultInvoiceFiltering("status.equals=" + DEFAULT_STATUS, "status.equals=" + UPDATED_STATUS);
    }

    @Test
    @Transactional
    void getAllInvoicesByStatusIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where status in
        defaultInvoiceFiltering("status.in=" + DEFAULT_STATUS + "," + UPDATED_STATUS, "status.in=" + UPDATED_STATUS);
    }

    @Test
    @Transactional
    void getAllInvoicesByStatusIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where status is not null
        defaultInvoiceFiltering("status.specified=true", "status.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByNotesIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where notes equals to
        defaultInvoiceFiltering("notes.equals=" + DEFAULT_NOTES, "notes.equals=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllInvoicesByNotesIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where notes in
        defaultInvoiceFiltering("notes.in=" + DEFAULT_NOTES + "," + UPDATED_NOTES, "notes.in=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllInvoicesByNotesIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where notes is not null
        defaultInvoiceFiltering("notes.specified=true", "notes.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByNotesContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where notes contains
        defaultInvoiceFiltering("notes.contains=" + DEFAULT_NOTES, "notes.contains=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllInvoicesByNotesNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where notes does not contain
        defaultInvoiceFiltering("notes.doesNotContain=" + UPDATED_NOTES, "notes.doesNotContain=" + DEFAULT_NOTES);
    }

    @Test
    @Transactional
    void getAllInvoicesByTermsIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where terms equals to
        defaultInvoiceFiltering("terms.equals=" + DEFAULT_TERMS, "terms.equals=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllInvoicesByTermsIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where terms in
        defaultInvoiceFiltering("terms.in=" + DEFAULT_TERMS + "," + UPDATED_TERMS, "terms.in=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllInvoicesByTermsIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where terms is not null
        defaultInvoiceFiltering("terms.specified=true", "terms.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByTermsContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where terms contains
        defaultInvoiceFiltering("terms.contains=" + DEFAULT_TERMS, "terms.contains=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllInvoicesByTermsNotContainsSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where terms does not contain
        defaultInvoiceFiltering("terms.doesNotContain=" + UPDATED_TERMS, "terms.doesNotContain=" + DEFAULT_TERMS);
    }

    @Test
    @Transactional
    void getAllInvoicesByFinalizedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where finalizedAt equals to
        defaultInvoiceFiltering("finalizedAt.equals=" + DEFAULT_FINALIZED_AT, "finalizedAt.equals=" + UPDATED_FINALIZED_AT);
    }

    @Test
    @Transactional
    void getAllInvoicesByFinalizedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where finalizedAt in
        defaultInvoiceFiltering(
            "finalizedAt.in=" + DEFAULT_FINALIZED_AT + "," + UPDATED_FINALIZED_AT,
            "finalizedAt.in=" + UPDATED_FINALIZED_AT
        );
    }

    @Test
    @Transactional
    void getAllInvoicesByFinalizedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where finalizedAt is not null
        defaultInvoiceFiltering("finalizedAt.specified=true", "finalizedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where deleted equals to
        defaultInvoiceFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllInvoicesByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where deleted in
        defaultInvoiceFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllInvoicesByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where deleted is not null
        defaultInvoiceFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where createdAt equals to
        defaultInvoiceFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllInvoicesByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where createdAt in
        defaultInvoiceFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllInvoicesByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where createdAt is not null
        defaultInvoiceFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where updatedAt equals to
        defaultInvoiceFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllInvoicesByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where updatedAt in
        defaultInvoiceFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllInvoicesByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        // Get all the invoiceList where updatedAt is not null
        defaultInvoiceFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllInvoicesByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            invoiceRepository.saveAndFlush(invoice);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        invoice.setBusiness(business);
        invoiceRepository.saveAndFlush(invoice);
        Long businessId = business.getId();
        // Get all the invoiceList where business equals to businessId
        defaultInvoiceShouldBeFound("businessId.equals=" + businessId);

        // Get all the invoiceList where business equals to (businessId + 1)
        defaultInvoiceShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    @Test
    @Transactional
    void getAllInvoicesByPartyIsEqualToSomething() throws Exception {
        Party party;
        if (TestUtil.findAll(em, Party.class).isEmpty()) {
            invoiceRepository.saveAndFlush(invoice);
            party = PartyResourceIT.createEntity();
        } else {
            party = TestUtil.findAll(em, Party.class).get(0);
        }
        em.persist(party);
        em.flush();
        invoice.setParty(party);
        invoiceRepository.saveAndFlush(invoice);
        Long partyId = party.getId();
        // Get all the invoiceList where party equals to partyId
        defaultInvoiceShouldBeFound("partyId.equals=" + partyId);

        // Get all the invoiceList where party equals to (partyId + 1)
        defaultInvoiceShouldNotBeFound("partyId.equals=" + (partyId + 1));
    }

    private void defaultInvoiceFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultInvoiceShouldBeFound(shouldBeFound);
        defaultInvoiceShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultInvoiceShouldBeFound(String filter) throws Exception {
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(invoice.getId().intValue())))
            .andExpect(jsonPath("$.[*].number").value(hasItem(DEFAULT_NUMBER)))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
            .andExpect(jsonPath("$.[*].paymentTermsDays").value(hasItem(DEFAULT_PAYMENT_TERMS_DAYS)))
            .andExpect(jsonPath("$.[*].partyName").value(hasItem(DEFAULT_PARTY_NAME)))
            .andExpect(jsonPath("$.[*].partyState").value(hasItem(DEFAULT_PARTY_STATE)))
            .andExpect(jsonPath("$.[*].businessState").value(hasItem(DEFAULT_BUSINESS_STATE)))
            .andExpect(jsonPath("$.[*].subtotal").value(hasItem(sameNumber(DEFAULT_SUBTOTAL))))
            .andExpect(jsonPath("$.[*].itemDiscountTotal").value(hasItem(sameNumber(DEFAULT_ITEM_DISCOUNT_TOTAL))))
            .andExpect(jsonPath("$.[*].overallDiscountKind").value(hasItem(DEFAULT_OVERALL_DISCOUNT_KIND.toString())))
            .andExpect(jsonPath("$.[*].overallDiscountValue").value(hasItem(sameNumber(DEFAULT_OVERALL_DISCOUNT_VALUE))))
            .andExpect(jsonPath("$.[*].overallDiscountAmount").value(hasItem(sameNumber(DEFAULT_OVERALL_DISCOUNT_AMOUNT))))
            .andExpect(jsonPath("$.[*].taxableValue").value(hasItem(sameNumber(DEFAULT_TAXABLE_VALUE))))
            .andExpect(jsonPath("$.[*].cgst").value(hasItem(sameNumber(DEFAULT_CGST))))
            .andExpect(jsonPath("$.[*].sgst").value(hasItem(sameNumber(DEFAULT_SGST))))
            .andExpect(jsonPath("$.[*].igst").value(hasItem(sameNumber(DEFAULT_IGST))))
            .andExpect(jsonPath("$.[*].taxTotal").value(hasItem(sameNumber(DEFAULT_TAX_TOTAL))))
            .andExpect(jsonPath("$.[*].total").value(hasItem(sameNumber(DEFAULT_TOTAL))))
            .andExpect(jsonPath("$.[*].paidAmount").value(hasItem(sameNumber(DEFAULT_PAID_AMOUNT))))
            .andExpect(jsonPath("$.[*].status").value(hasItem(DEFAULT_STATUS.toString())))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].terms").value(hasItem(DEFAULT_TERMS)))
            .andExpect(jsonPath("$.[*].finalizedAt").value(hasItem(DEFAULT_FINALIZED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultInvoiceShouldNotBeFound(String filter) throws Exception {
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restInvoiceMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingInvoice() throws Exception {
        // Get the invoice
        restInvoiceMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingInvoice() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoice
        Invoice updatedInvoice = invoiceRepository.findById(invoice.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedInvoice are not directly saved in db
        em.detach(updatedInvoice);
        updatedInvoice
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .partyName(UPDATED_PARTY_NAME)
            .partyState(UPDATED_PARTY_STATE)
            .businessState(UPDATED_BUSINESS_STATE)
            .subtotal(UPDATED_SUBTOTAL)
            .itemDiscountTotal(UPDATED_ITEM_DISCOUNT_TOTAL)
            .overallDiscountKind(UPDATED_OVERALL_DISCOUNT_KIND)
            .overallDiscountValue(UPDATED_OVERALL_DISCOUNT_VALUE)
            .overallDiscountAmount(UPDATED_OVERALL_DISCOUNT_AMOUNT)
            .taxableValue(UPDATED_TAXABLE_VALUE)
            .cgst(UPDATED_CGST)
            .sgst(UPDATED_SGST)
            .igst(UPDATED_IGST)
            .taxTotal(UPDATED_TAX_TOTAL)
            .total(UPDATED_TOTAL)
            .paidAmount(UPDATED_PAID_AMOUNT)
            .status(UPDATED_STATUS)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(updatedInvoice);

        restInvoiceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, invoiceDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO))
            )
            .andExpect(status().isOk());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedInvoiceToMatchAllProperties(updatedInvoice);
    }

    @Test
    @Transactional
    void putNonExistingInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, invoiceDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(invoiceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateInvoiceWithPatch() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoice using partial update
        Invoice partialUpdatedInvoice = new Invoice();
        partialUpdatedInvoice.setId(invoice.getId());

        partialUpdatedInvoice
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .partyName(UPDATED_PARTY_NAME)
            .partyState(UPDATED_PARTY_STATE)
            .overallDiscountValue(UPDATED_OVERALL_DISCOUNT_VALUE)
            .overallDiscountAmount(UPDATED_OVERALL_DISCOUNT_AMOUNT)
            .igst(UPDATED_IGST)
            .taxTotal(UPDATED_TAX_TOTAL)
            .total(UPDATED_TOTAL)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restInvoiceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedInvoice.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedInvoice))
            )
            .andExpect(status().isOk());

        // Validate the Invoice in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertInvoiceUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedInvoice, invoice), getPersistedInvoice(invoice));
    }

    @Test
    @Transactional
    void fullUpdateInvoiceWithPatch() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the invoice using partial update
        Invoice partialUpdatedInvoice = new Invoice();
        partialUpdatedInvoice.setId(invoice.getId());

        partialUpdatedInvoice
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .partyName(UPDATED_PARTY_NAME)
            .partyState(UPDATED_PARTY_STATE)
            .businessState(UPDATED_BUSINESS_STATE)
            .subtotal(UPDATED_SUBTOTAL)
            .itemDiscountTotal(UPDATED_ITEM_DISCOUNT_TOTAL)
            .overallDiscountKind(UPDATED_OVERALL_DISCOUNT_KIND)
            .overallDiscountValue(UPDATED_OVERALL_DISCOUNT_VALUE)
            .overallDiscountAmount(UPDATED_OVERALL_DISCOUNT_AMOUNT)
            .taxableValue(UPDATED_TAXABLE_VALUE)
            .cgst(UPDATED_CGST)
            .sgst(UPDATED_SGST)
            .igst(UPDATED_IGST)
            .taxTotal(UPDATED_TAX_TOTAL)
            .total(UPDATED_TOTAL)
            .paidAmount(UPDATED_PAID_AMOUNT)
            .status(UPDATED_STATUS)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restInvoiceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedInvoice.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedInvoice))
            )
            .andExpect(status().isOk());

        // Validate the Invoice in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertInvoiceUpdatableFieldsEquals(partialUpdatedInvoice, getPersistedInvoice(partialUpdatedInvoice));
    }

    @Test
    @Transactional
    void patchNonExistingInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, invoiceDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(invoiceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(invoiceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamInvoice() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        invoice.setId(longCount.incrementAndGet());

        // Create the Invoice
        InvoiceDTO invoiceDTO = invoiceMapper.toDto(invoice);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restInvoiceMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(invoiceDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Invoice in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteInvoice() throws Exception {
        // Initialize the database
        insertedInvoice = invoiceRepository.saveAndFlush(invoice);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the invoice
        restInvoiceMockMvc
            .perform(delete(ENTITY_API_URL_ID, invoice.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return invoiceRepository.count();
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

    protected Invoice getPersistedInvoice(Invoice invoice) {
        return invoiceRepository.findById(invoice.getId()).orElseThrow();
    }

    protected void assertPersistedInvoiceToMatchAllProperties(Invoice expectedInvoice) {
        assertInvoiceAllPropertiesEquals(expectedInvoice, getPersistedInvoice(expectedInvoice));
    }

    protected void assertPersistedInvoiceToMatchUpdatableProperties(Invoice expectedInvoice) {
        assertInvoiceAllUpdatablePropertiesEquals(expectedInvoice, getPersistedInvoice(expectedInvoice));
    }
}
