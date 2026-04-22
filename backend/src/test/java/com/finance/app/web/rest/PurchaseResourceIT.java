package com.finance.app.web.rest;

import static com.finance.app.domain.PurchaseAsserts.*;
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
import com.finance.app.domain.Party;
import com.finance.app.domain.Purchase;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.PurchaseKind;
import com.finance.app.domain.enumeration.PurchaseStatus;
import com.finance.app.repository.PurchaseRepository;
import com.finance.app.service.PurchaseService;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.service.mapper.PurchaseMapper;
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
 * Integration tests for the {@link PurchaseResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class PurchaseResourceIT {

    private static final String DEFAULT_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_NUMBER = "BBBBBBBBBB";

    private static final Instant DEFAULT_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_DUE_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DUE_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

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

    private static final PurchaseStatus DEFAULT_STATUS = PurchaseStatus.DRAFT;
    private static final PurchaseStatus UPDATED_STATUS = PurchaseStatus.FINAL;

    private static final PurchaseKind DEFAULT_KIND = PurchaseKind.PURCHASE;
    private static final PurchaseKind UPDATED_KIND = PurchaseKind.RETURN;

    private static final Long DEFAULT_SOURCE_PURCHASE_ID = 1L;
    private static final Long UPDATED_SOURCE_PURCHASE_ID = 2L;
    private static final Long SMALLER_SOURCE_PURCHASE_ID = 1L - 1L;

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

    private static final String ENTITY_API_URL = "/api/purchases";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Mock
    private PurchaseRepository purchaseRepositoryMock;

    @Autowired
    private PurchaseMapper purchaseMapper;

    @Mock
    private PurchaseService purchaseServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPurchaseMockMvc;

    private Purchase purchase;

    private Purchase insertedPurchase;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Purchase createEntity() {
        return new Purchase()
            .number(DEFAULT_NUMBER)
            .date(DEFAULT_DATE)
            .dueDate(DEFAULT_DUE_DATE)
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
            .kind(DEFAULT_KIND)
            .sourcePurchaseId(DEFAULT_SOURCE_PURCHASE_ID)
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
    public static Purchase createUpdatedEntity() {
        return new Purchase()
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
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
            .kind(UPDATED_KIND)
            .sourcePurchaseId(UPDATED_SOURCE_PURCHASE_ID)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        purchase = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedPurchase != null) {
            purchaseRepository.delete(insertedPurchase);
            insertedPurchase = null;
        }
    }

    @Test
    @Transactional
    void createPurchase() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);
        var returnedPurchaseDTO = om.readValue(
            restPurchaseMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PurchaseDTO.class
        );

        // Validate the Purchase in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPurchase = purchaseMapper.toEntity(returnedPurchaseDTO);
        assertPurchaseUpdatableFieldsEquals(returnedPurchase, getPersistedPurchase(returnedPurchase));

        insertedPurchase = returnedPurchase;
    }

    @Test
    @Transactional
    void createPurchaseWithExistingId() throws Exception {
        // Create the Purchase with an existing ID
        purchase.setId(1L);
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNumberIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setNumber(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setDate(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkPartyNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setPartyName(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSubtotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setSubtotal(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkItemDiscountTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setItemDiscountTotal(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountKindIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setOverallDiscountKind(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setOverallDiscountValue(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOverallDiscountAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setOverallDiscountAmount(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxableValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setTaxableValue(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setCgst(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setSgst(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkIgstIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setIgst(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setTaxTotal(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTotalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setTotal(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkPaidAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setPaidAmount(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkStatusIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setStatus(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchase.setCreatedAt(null);

        // Create the Purchase, which fails.
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        restPurchaseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPurchases() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(purchase.getId().intValue())))
            .andExpect(jsonPath("$.[*].number").value(hasItem(DEFAULT_NUMBER)))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
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
            .andExpect(jsonPath("$.[*].kind").value(hasItem(DEFAULT_KIND.toString())))
            .andExpect(jsonPath("$.[*].sourcePurchaseId").value(hasItem(DEFAULT_SOURCE_PURCHASE_ID.intValue())))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].terms").value(hasItem(DEFAULT_TERMS)))
            .andExpect(jsonPath("$.[*].finalizedAt").value(hasItem(DEFAULT_FINALIZED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPurchasesWithEagerRelationshipsIsEnabled() throws Exception {
        when(purchaseServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPurchaseMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(purchaseServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPurchasesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(purchaseServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPurchaseMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(purchaseRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getPurchase() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get the purchase
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL_ID, purchase.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(purchase.getId().intValue()))
            .andExpect(jsonPath("$.number").value(DEFAULT_NUMBER))
            .andExpect(jsonPath("$.date").value(DEFAULT_DATE.toString()))
            .andExpect(jsonPath("$.dueDate").value(DEFAULT_DUE_DATE.toString()))
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
            .andExpect(jsonPath("$.kind").value(DEFAULT_KIND.toString()))
            .andExpect(jsonPath("$.sourcePurchaseId").value(DEFAULT_SOURCE_PURCHASE_ID.intValue()))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.terms").value(DEFAULT_TERMS))
            .andExpect(jsonPath("$.finalizedAt").value(DEFAULT_FINALIZED_AT.toString()))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getPurchasesByIdFiltering() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        Long id = purchase.getId();

        defaultPurchaseFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultPurchaseFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultPurchaseFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllPurchasesByNumberIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where number equals to
        defaultPurchaseFiltering("number.equals=" + DEFAULT_NUMBER, "number.equals=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllPurchasesByNumberIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where number in
        defaultPurchaseFiltering("number.in=" + DEFAULT_NUMBER + "," + UPDATED_NUMBER, "number.in=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllPurchasesByNumberIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where number is not null
        defaultPurchaseFiltering("number.specified=true", "number.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByNumberContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where number contains
        defaultPurchaseFiltering("number.contains=" + DEFAULT_NUMBER, "number.contains=" + UPDATED_NUMBER);
    }

    @Test
    @Transactional
    void getAllPurchasesByNumberNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where number does not contain
        defaultPurchaseFiltering("number.doesNotContain=" + UPDATED_NUMBER, "number.doesNotContain=" + DEFAULT_NUMBER);
    }

    @Test
    @Transactional
    void getAllPurchasesByDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where date equals to
        defaultPurchaseFiltering("date.equals=" + DEFAULT_DATE, "date.equals=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where date in
        defaultPurchaseFiltering("date.in=" + DEFAULT_DATE + "," + UPDATED_DATE, "date.in=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where date is not null
        defaultPurchaseFiltering("date.specified=true", "date.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByDueDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where dueDate equals to
        defaultPurchaseFiltering("dueDate.equals=" + DEFAULT_DUE_DATE, "dueDate.equals=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByDueDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where dueDate in
        defaultPurchaseFiltering("dueDate.in=" + DEFAULT_DUE_DATE + "," + UPDATED_DUE_DATE, "dueDate.in=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByDueDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where dueDate is not null
        defaultPurchaseFiltering("dueDate.specified=true", "dueDate.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyNameIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyName equals to
        defaultPurchaseFiltering("partyName.equals=" + DEFAULT_PARTY_NAME, "partyName.equals=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyNameIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyName in
        defaultPurchaseFiltering("partyName.in=" + DEFAULT_PARTY_NAME + "," + UPDATED_PARTY_NAME, "partyName.in=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyNameIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyName is not null
        defaultPurchaseFiltering("partyName.specified=true", "partyName.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyNameContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyName contains
        defaultPurchaseFiltering("partyName.contains=" + DEFAULT_PARTY_NAME, "partyName.contains=" + UPDATED_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyNameNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyName does not contain
        defaultPurchaseFiltering("partyName.doesNotContain=" + UPDATED_PARTY_NAME, "partyName.doesNotContain=" + DEFAULT_PARTY_NAME);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyStateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyState equals to
        defaultPurchaseFiltering("partyState.equals=" + DEFAULT_PARTY_STATE, "partyState.equals=" + UPDATED_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyStateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyState in
        defaultPurchaseFiltering(
            "partyState.in=" + DEFAULT_PARTY_STATE + "," + UPDATED_PARTY_STATE,
            "partyState.in=" + UPDATED_PARTY_STATE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyStateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyState is not null
        defaultPurchaseFiltering("partyState.specified=true", "partyState.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyStateContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyState contains
        defaultPurchaseFiltering("partyState.contains=" + DEFAULT_PARTY_STATE, "partyState.contains=" + UPDATED_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyStateNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where partyState does not contain
        defaultPurchaseFiltering("partyState.doesNotContain=" + UPDATED_PARTY_STATE, "partyState.doesNotContain=" + DEFAULT_PARTY_STATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessStateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where businessState equals to
        defaultPurchaseFiltering("businessState.equals=" + DEFAULT_BUSINESS_STATE, "businessState.equals=" + UPDATED_BUSINESS_STATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessStateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where businessState in
        defaultPurchaseFiltering(
            "businessState.in=" + DEFAULT_BUSINESS_STATE + "," + UPDATED_BUSINESS_STATE,
            "businessState.in=" + UPDATED_BUSINESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessStateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where businessState is not null
        defaultPurchaseFiltering("businessState.specified=true", "businessState.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessStateContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where businessState contains
        defaultPurchaseFiltering("businessState.contains=" + DEFAULT_BUSINESS_STATE, "businessState.contains=" + UPDATED_BUSINESS_STATE);
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessStateNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where businessState does not contain
        defaultPurchaseFiltering(
            "businessState.doesNotContain=" + UPDATED_BUSINESS_STATE,
            "businessState.doesNotContain=" + DEFAULT_BUSINESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal equals to
        defaultPurchaseFiltering("subtotal.equals=" + DEFAULT_SUBTOTAL, "subtotal.equals=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal in
        defaultPurchaseFiltering("subtotal.in=" + DEFAULT_SUBTOTAL + "," + UPDATED_SUBTOTAL, "subtotal.in=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal is not null
        defaultPurchaseFiltering("subtotal.specified=true", "subtotal.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal is greater than or equal to
        defaultPurchaseFiltering("subtotal.greaterThanOrEqual=" + DEFAULT_SUBTOTAL, "subtotal.greaterThanOrEqual=" + UPDATED_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal is less than or equal to
        defaultPurchaseFiltering("subtotal.lessThanOrEqual=" + DEFAULT_SUBTOTAL, "subtotal.lessThanOrEqual=" + SMALLER_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal is less than
        defaultPurchaseFiltering("subtotal.lessThan=" + UPDATED_SUBTOTAL, "subtotal.lessThan=" + DEFAULT_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesBySubtotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where subtotal is greater than
        defaultPurchaseFiltering("subtotal.greaterThan=" + SMALLER_SUBTOTAL, "subtotal.greaterThan=" + DEFAULT_SUBTOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal equals to
        defaultPurchaseFiltering(
            "itemDiscountTotal.equals=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.equals=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal in
        defaultPurchaseFiltering(
            "itemDiscountTotal.in=" + DEFAULT_ITEM_DISCOUNT_TOTAL + "," + UPDATED_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.in=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal is not null
        defaultPurchaseFiltering("itemDiscountTotal.specified=true", "itemDiscountTotal.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal is greater than or equal to
        defaultPurchaseFiltering(
            "itemDiscountTotal.greaterThanOrEqual=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.greaterThanOrEqual=" + UPDATED_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal is less than or equal to
        defaultPurchaseFiltering(
            "itemDiscountTotal.lessThanOrEqual=" + DEFAULT_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.lessThanOrEqual=" + SMALLER_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal is less than
        defaultPurchaseFiltering(
            "itemDiscountTotal.lessThan=" + UPDATED_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.lessThan=" + DEFAULT_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByItemDiscountTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where itemDiscountTotal is greater than
        defaultPurchaseFiltering(
            "itemDiscountTotal.greaterThan=" + SMALLER_ITEM_DISCOUNT_TOTAL,
            "itemDiscountTotal.greaterThan=" + DEFAULT_ITEM_DISCOUNT_TOTAL
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountKindIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountKind equals to
        defaultPurchaseFiltering(
            "overallDiscountKind.equals=" + DEFAULT_OVERALL_DISCOUNT_KIND,
            "overallDiscountKind.equals=" + UPDATED_OVERALL_DISCOUNT_KIND
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountKindIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountKind in
        defaultPurchaseFiltering(
            "overallDiscountKind.in=" + DEFAULT_OVERALL_DISCOUNT_KIND + "," + UPDATED_OVERALL_DISCOUNT_KIND,
            "overallDiscountKind.in=" + UPDATED_OVERALL_DISCOUNT_KIND
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountKindIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountKind is not null
        defaultPurchaseFiltering("overallDiscountKind.specified=true", "overallDiscountKind.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue equals to
        defaultPurchaseFiltering(
            "overallDiscountValue.equals=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.equals=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue in
        defaultPurchaseFiltering(
            "overallDiscountValue.in=" + DEFAULT_OVERALL_DISCOUNT_VALUE + "," + UPDATED_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.in=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue is not null
        defaultPurchaseFiltering("overallDiscountValue.specified=true", "overallDiscountValue.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue is greater than or equal to
        defaultPurchaseFiltering(
            "overallDiscountValue.greaterThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.greaterThanOrEqual=" + UPDATED_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue is less than or equal to
        defaultPurchaseFiltering(
            "overallDiscountValue.lessThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.lessThanOrEqual=" + SMALLER_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue is less than
        defaultPurchaseFiltering(
            "overallDiscountValue.lessThan=" + UPDATED_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.lessThan=" + DEFAULT_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountValueIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountValue is greater than
        defaultPurchaseFiltering(
            "overallDiscountValue.greaterThan=" + SMALLER_OVERALL_DISCOUNT_VALUE,
            "overallDiscountValue.greaterThan=" + DEFAULT_OVERALL_DISCOUNT_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount equals to
        defaultPurchaseFiltering(
            "overallDiscountAmount.equals=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.equals=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount in
        defaultPurchaseFiltering(
            "overallDiscountAmount.in=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT + "," + UPDATED_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.in=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount is not null
        defaultPurchaseFiltering("overallDiscountAmount.specified=true", "overallDiscountAmount.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount is greater than or equal to
        defaultPurchaseFiltering(
            "overallDiscountAmount.greaterThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.greaterThanOrEqual=" + UPDATED_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount is less than or equal to
        defaultPurchaseFiltering(
            "overallDiscountAmount.lessThanOrEqual=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.lessThanOrEqual=" + SMALLER_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount is less than
        defaultPurchaseFiltering(
            "overallDiscountAmount.lessThan=" + UPDATED_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.lessThan=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByOverallDiscountAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where overallDiscountAmount is greater than
        defaultPurchaseFiltering(
            "overallDiscountAmount.greaterThan=" + SMALLER_OVERALL_DISCOUNT_AMOUNT,
            "overallDiscountAmount.greaterThan=" + DEFAULT_OVERALL_DISCOUNT_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue equals to
        defaultPurchaseFiltering("taxableValue.equals=" + DEFAULT_TAXABLE_VALUE, "taxableValue.equals=" + UPDATED_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue in
        defaultPurchaseFiltering(
            "taxableValue.in=" + DEFAULT_TAXABLE_VALUE + "," + UPDATED_TAXABLE_VALUE,
            "taxableValue.in=" + UPDATED_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue is not null
        defaultPurchaseFiltering("taxableValue.specified=true", "taxableValue.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue is greater than or equal to
        defaultPurchaseFiltering(
            "taxableValue.greaterThanOrEqual=" + DEFAULT_TAXABLE_VALUE,
            "taxableValue.greaterThanOrEqual=" + UPDATED_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue is less than or equal to
        defaultPurchaseFiltering(
            "taxableValue.lessThanOrEqual=" + DEFAULT_TAXABLE_VALUE,
            "taxableValue.lessThanOrEqual=" + SMALLER_TAXABLE_VALUE
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue is less than
        defaultPurchaseFiltering("taxableValue.lessThan=" + UPDATED_TAXABLE_VALUE, "taxableValue.lessThan=" + DEFAULT_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxableValueIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxableValue is greater than
        defaultPurchaseFiltering("taxableValue.greaterThan=" + SMALLER_TAXABLE_VALUE, "taxableValue.greaterThan=" + DEFAULT_TAXABLE_VALUE);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst equals to
        defaultPurchaseFiltering("cgst.equals=" + DEFAULT_CGST, "cgst.equals=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst in
        defaultPurchaseFiltering("cgst.in=" + DEFAULT_CGST + "," + UPDATED_CGST, "cgst.in=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst is not null
        defaultPurchaseFiltering("cgst.specified=true", "cgst.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst is greater than or equal to
        defaultPurchaseFiltering("cgst.greaterThanOrEqual=" + DEFAULT_CGST, "cgst.greaterThanOrEqual=" + UPDATED_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst is less than or equal to
        defaultPurchaseFiltering("cgst.lessThanOrEqual=" + DEFAULT_CGST, "cgst.lessThanOrEqual=" + SMALLER_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst is less than
        defaultPurchaseFiltering("cgst.lessThan=" + UPDATED_CGST, "cgst.lessThan=" + DEFAULT_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByCgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where cgst is greater than
        defaultPurchaseFiltering("cgst.greaterThan=" + SMALLER_CGST, "cgst.greaterThan=" + DEFAULT_CGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst equals to
        defaultPurchaseFiltering("sgst.equals=" + DEFAULT_SGST, "sgst.equals=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst in
        defaultPurchaseFiltering("sgst.in=" + DEFAULT_SGST + "," + UPDATED_SGST, "sgst.in=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst is not null
        defaultPurchaseFiltering("sgst.specified=true", "sgst.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst is greater than or equal to
        defaultPurchaseFiltering("sgst.greaterThanOrEqual=" + DEFAULT_SGST, "sgst.greaterThanOrEqual=" + UPDATED_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst is less than or equal to
        defaultPurchaseFiltering("sgst.lessThanOrEqual=" + DEFAULT_SGST, "sgst.lessThanOrEqual=" + SMALLER_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst is less than
        defaultPurchaseFiltering("sgst.lessThan=" + UPDATED_SGST, "sgst.lessThan=" + DEFAULT_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesBySgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sgst is greater than
        defaultPurchaseFiltering("sgst.greaterThan=" + SMALLER_SGST, "sgst.greaterThan=" + DEFAULT_SGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst equals to
        defaultPurchaseFiltering("igst.equals=" + DEFAULT_IGST, "igst.equals=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst in
        defaultPurchaseFiltering("igst.in=" + DEFAULT_IGST + "," + UPDATED_IGST, "igst.in=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst is not null
        defaultPurchaseFiltering("igst.specified=true", "igst.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst is greater than or equal to
        defaultPurchaseFiltering("igst.greaterThanOrEqual=" + DEFAULT_IGST, "igst.greaterThanOrEqual=" + UPDATED_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst is less than or equal to
        defaultPurchaseFiltering("igst.lessThanOrEqual=" + DEFAULT_IGST, "igst.lessThanOrEqual=" + SMALLER_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst is less than
        defaultPurchaseFiltering("igst.lessThan=" + UPDATED_IGST, "igst.lessThan=" + DEFAULT_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByIgstIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where igst is greater than
        defaultPurchaseFiltering("igst.greaterThan=" + SMALLER_IGST, "igst.greaterThan=" + DEFAULT_IGST);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal equals to
        defaultPurchaseFiltering("taxTotal.equals=" + DEFAULT_TAX_TOTAL, "taxTotal.equals=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal in
        defaultPurchaseFiltering("taxTotal.in=" + DEFAULT_TAX_TOTAL + "," + UPDATED_TAX_TOTAL, "taxTotal.in=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal is not null
        defaultPurchaseFiltering("taxTotal.specified=true", "taxTotal.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal is greater than or equal to
        defaultPurchaseFiltering("taxTotal.greaterThanOrEqual=" + DEFAULT_TAX_TOTAL, "taxTotal.greaterThanOrEqual=" + UPDATED_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal is less than or equal to
        defaultPurchaseFiltering("taxTotal.lessThanOrEqual=" + DEFAULT_TAX_TOTAL, "taxTotal.lessThanOrEqual=" + SMALLER_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal is less than
        defaultPurchaseFiltering("taxTotal.lessThan=" + UPDATED_TAX_TOTAL, "taxTotal.lessThan=" + DEFAULT_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTaxTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where taxTotal is greater than
        defaultPurchaseFiltering("taxTotal.greaterThan=" + SMALLER_TAX_TOTAL, "taxTotal.greaterThan=" + DEFAULT_TAX_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total equals to
        defaultPurchaseFiltering("total.equals=" + DEFAULT_TOTAL, "total.equals=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total in
        defaultPurchaseFiltering("total.in=" + DEFAULT_TOTAL + "," + UPDATED_TOTAL, "total.in=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total is not null
        defaultPurchaseFiltering("total.specified=true", "total.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total is greater than or equal to
        defaultPurchaseFiltering("total.greaterThanOrEqual=" + DEFAULT_TOTAL, "total.greaterThanOrEqual=" + UPDATED_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total is less than or equal to
        defaultPurchaseFiltering("total.lessThanOrEqual=" + DEFAULT_TOTAL, "total.lessThanOrEqual=" + SMALLER_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total is less than
        defaultPurchaseFiltering("total.lessThan=" + UPDATED_TOTAL, "total.lessThan=" + DEFAULT_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByTotalIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where total is greater than
        defaultPurchaseFiltering("total.greaterThan=" + SMALLER_TOTAL, "total.greaterThan=" + DEFAULT_TOTAL);
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount equals to
        defaultPurchaseFiltering("paidAmount.equals=" + DEFAULT_PAID_AMOUNT, "paidAmount.equals=" + UPDATED_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount in
        defaultPurchaseFiltering(
            "paidAmount.in=" + DEFAULT_PAID_AMOUNT + "," + UPDATED_PAID_AMOUNT,
            "paidAmount.in=" + UPDATED_PAID_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount is not null
        defaultPurchaseFiltering("paidAmount.specified=true", "paidAmount.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount is greater than or equal to
        defaultPurchaseFiltering(
            "paidAmount.greaterThanOrEqual=" + DEFAULT_PAID_AMOUNT,
            "paidAmount.greaterThanOrEqual=" + UPDATED_PAID_AMOUNT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount is less than or equal to
        defaultPurchaseFiltering("paidAmount.lessThanOrEqual=" + DEFAULT_PAID_AMOUNT, "paidAmount.lessThanOrEqual=" + SMALLER_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount is less than
        defaultPurchaseFiltering("paidAmount.lessThan=" + UPDATED_PAID_AMOUNT, "paidAmount.lessThan=" + DEFAULT_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllPurchasesByPaidAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where paidAmount is greater than
        defaultPurchaseFiltering("paidAmount.greaterThan=" + SMALLER_PAID_AMOUNT, "paidAmount.greaterThan=" + DEFAULT_PAID_AMOUNT);
    }

    @Test
    @Transactional
    void getAllPurchasesByStatusIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where status equals to
        defaultPurchaseFiltering("status.equals=" + DEFAULT_STATUS, "status.equals=" + UPDATED_STATUS);
    }

    @Test
    @Transactional
    void getAllPurchasesByStatusIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where status in
        defaultPurchaseFiltering("status.in=" + DEFAULT_STATUS + "," + UPDATED_STATUS, "status.in=" + UPDATED_STATUS);
    }

    @Test
    @Transactional
    void getAllPurchasesByStatusIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where status is not null
        defaultPurchaseFiltering("status.specified=true", "status.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByKindIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where kind equals to
        defaultPurchaseFiltering("kind.equals=" + DEFAULT_KIND, "kind.equals=" + UPDATED_KIND);
    }

    @Test
    @Transactional
    void getAllPurchasesByKindIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where kind in
        defaultPurchaseFiltering("kind.in=" + DEFAULT_KIND + "," + UPDATED_KIND, "kind.in=" + UPDATED_KIND);
    }

    @Test
    @Transactional
    void getAllPurchasesByKindIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where kind is not null
        defaultPurchaseFiltering("kind.specified=true", "kind.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId equals to
        defaultPurchaseFiltering(
            "sourcePurchaseId.equals=" + DEFAULT_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.equals=" + UPDATED_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId in
        defaultPurchaseFiltering(
            "sourcePurchaseId.in=" + DEFAULT_SOURCE_PURCHASE_ID + "," + UPDATED_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.in=" + UPDATED_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId is not null
        defaultPurchaseFiltering("sourcePurchaseId.specified=true", "sourcePurchaseId.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId is greater than or equal to
        defaultPurchaseFiltering(
            "sourcePurchaseId.greaterThanOrEqual=" + DEFAULT_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.greaterThanOrEqual=" + UPDATED_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId is less than or equal to
        defaultPurchaseFiltering(
            "sourcePurchaseId.lessThanOrEqual=" + DEFAULT_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.lessThanOrEqual=" + SMALLER_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId is less than
        defaultPurchaseFiltering(
            "sourcePurchaseId.lessThan=" + UPDATED_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.lessThan=" + DEFAULT_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesBySourcePurchaseIdIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where sourcePurchaseId is greater than
        defaultPurchaseFiltering(
            "sourcePurchaseId.greaterThan=" + SMALLER_SOURCE_PURCHASE_ID,
            "sourcePurchaseId.greaterThan=" + DEFAULT_SOURCE_PURCHASE_ID
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByNotesIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where notes equals to
        defaultPurchaseFiltering("notes.equals=" + DEFAULT_NOTES, "notes.equals=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllPurchasesByNotesIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where notes in
        defaultPurchaseFiltering("notes.in=" + DEFAULT_NOTES + "," + UPDATED_NOTES, "notes.in=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllPurchasesByNotesIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where notes is not null
        defaultPurchaseFiltering("notes.specified=true", "notes.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByNotesContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where notes contains
        defaultPurchaseFiltering("notes.contains=" + DEFAULT_NOTES, "notes.contains=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllPurchasesByNotesNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where notes does not contain
        defaultPurchaseFiltering("notes.doesNotContain=" + UPDATED_NOTES, "notes.doesNotContain=" + DEFAULT_NOTES);
    }

    @Test
    @Transactional
    void getAllPurchasesByTermsIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where terms equals to
        defaultPurchaseFiltering("terms.equals=" + DEFAULT_TERMS, "terms.equals=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllPurchasesByTermsIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where terms in
        defaultPurchaseFiltering("terms.in=" + DEFAULT_TERMS + "," + UPDATED_TERMS, "terms.in=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllPurchasesByTermsIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where terms is not null
        defaultPurchaseFiltering("terms.specified=true", "terms.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByTermsContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where terms contains
        defaultPurchaseFiltering("terms.contains=" + DEFAULT_TERMS, "terms.contains=" + UPDATED_TERMS);
    }

    @Test
    @Transactional
    void getAllPurchasesByTermsNotContainsSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where terms does not contain
        defaultPurchaseFiltering("terms.doesNotContain=" + UPDATED_TERMS, "terms.doesNotContain=" + DEFAULT_TERMS);
    }

    @Test
    @Transactional
    void getAllPurchasesByFinalizedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where finalizedAt equals to
        defaultPurchaseFiltering("finalizedAt.equals=" + DEFAULT_FINALIZED_AT, "finalizedAt.equals=" + UPDATED_FINALIZED_AT);
    }

    @Test
    @Transactional
    void getAllPurchasesByFinalizedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where finalizedAt in
        defaultPurchaseFiltering(
            "finalizedAt.in=" + DEFAULT_FINALIZED_AT + "," + UPDATED_FINALIZED_AT,
            "finalizedAt.in=" + UPDATED_FINALIZED_AT
        );
    }

    @Test
    @Transactional
    void getAllPurchasesByFinalizedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where finalizedAt is not null
        defaultPurchaseFiltering("finalizedAt.specified=true", "finalizedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where deleted equals to
        defaultPurchaseFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllPurchasesByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where deleted in
        defaultPurchaseFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllPurchasesByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where deleted is not null
        defaultPurchaseFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where createdAt equals to
        defaultPurchaseFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllPurchasesByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where createdAt in
        defaultPurchaseFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllPurchasesByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where createdAt is not null
        defaultPurchaseFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where updatedAt equals to
        defaultPurchaseFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllPurchasesByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where updatedAt in
        defaultPurchaseFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllPurchasesByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        // Get all the purchaseList where updatedAt is not null
        defaultPurchaseFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllPurchasesByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            purchaseRepository.saveAndFlush(purchase);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        purchase.setBusiness(business);
        purchaseRepository.saveAndFlush(purchase);
        Long businessId = business.getId();
        // Get all the purchaseList where business equals to businessId
        defaultPurchaseShouldBeFound("businessId.equals=" + businessId);

        // Get all the purchaseList where business equals to (businessId + 1)
        defaultPurchaseShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    @Test
    @Transactional
    void getAllPurchasesByPartyIsEqualToSomething() throws Exception {
        Party party;
        if (TestUtil.findAll(em, Party.class).isEmpty()) {
            purchaseRepository.saveAndFlush(purchase);
            party = PartyResourceIT.createEntity();
        } else {
            party = TestUtil.findAll(em, Party.class).get(0);
        }
        em.persist(party);
        em.flush();
        purchase.setParty(party);
        purchaseRepository.saveAndFlush(purchase);
        Long partyId = party.getId();
        // Get all the purchaseList where party equals to partyId
        defaultPurchaseShouldBeFound("partyId.equals=" + partyId);

        // Get all the purchaseList where party equals to (partyId + 1)
        defaultPurchaseShouldNotBeFound("partyId.equals=" + (partyId + 1));
    }

    private void defaultPurchaseFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultPurchaseShouldBeFound(shouldBeFound);
        defaultPurchaseShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultPurchaseShouldBeFound(String filter) throws Exception {
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(purchase.getId().intValue())))
            .andExpect(jsonPath("$.[*].number").value(hasItem(DEFAULT_NUMBER)))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
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
            .andExpect(jsonPath("$.[*].kind").value(hasItem(DEFAULT_KIND.toString())))
            .andExpect(jsonPath("$.[*].sourcePurchaseId").value(hasItem(DEFAULT_SOURCE_PURCHASE_ID.intValue())))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].terms").value(hasItem(DEFAULT_TERMS)))
            .andExpect(jsonPath("$.[*].finalizedAt").value(hasItem(DEFAULT_FINALIZED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultPurchaseShouldNotBeFound(String filter) throws Exception {
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restPurchaseMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingPurchase() throws Exception {
        // Get the purchase
        restPurchaseMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPurchase() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchase
        Purchase updatedPurchase = purchaseRepository.findById(purchase.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPurchase are not directly saved in db
        em.detach(updatedPurchase);
        updatedPurchase
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
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
            .kind(UPDATED_KIND)
            .sourcePurchaseId(UPDATED_SOURCE_PURCHASE_ID)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(updatedPurchase);

        restPurchaseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, purchaseDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseDTO))
            )
            .andExpect(status().isOk());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPurchaseToMatchAllProperties(updatedPurchase);
    }

    @Test
    @Transactional
    void putNonExistingPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, purchaseDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePurchaseWithPatch() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchase using partial update
        Purchase partialUpdatedPurchase = new Purchase();
        partialUpdatedPurchase.setId(purchase.getId());

        partialUpdatedPurchase
            .number(UPDATED_NUMBER)
            .partyName(UPDATED_PARTY_NAME)
            .partyState(UPDATED_PARTY_STATE)
            .subtotal(UPDATED_SUBTOTAL)
            .itemDiscountTotal(UPDATED_ITEM_DISCOUNT_TOTAL)
            .taxableValue(UPDATED_TAXABLE_VALUE)
            .igst(UPDATED_IGST)
            .taxTotal(UPDATED_TAX_TOTAL)
            .paidAmount(UPDATED_PAID_AMOUNT)
            .kind(UPDATED_KIND)
            .sourcePurchaseId(UPDATED_SOURCE_PURCHASE_ID)
            .deleted(UPDATED_DELETED);

        restPurchaseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPurchase.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPurchase))
            )
            .andExpect(status().isOk());

        // Validate the Purchase in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPurchaseUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedPurchase, purchase), getPersistedPurchase(purchase));
    }

    @Test
    @Transactional
    void fullUpdatePurchaseWithPatch() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchase using partial update
        Purchase partialUpdatedPurchase = new Purchase();
        partialUpdatedPurchase.setId(purchase.getId());

        partialUpdatedPurchase
            .number(UPDATED_NUMBER)
            .date(UPDATED_DATE)
            .dueDate(UPDATED_DUE_DATE)
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
            .kind(UPDATED_KIND)
            .sourcePurchaseId(UPDATED_SOURCE_PURCHASE_ID)
            .notes(UPDATED_NOTES)
            .terms(UPDATED_TERMS)
            .finalizedAt(UPDATED_FINALIZED_AT)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restPurchaseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPurchase.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPurchase))
            )
            .andExpect(status().isOk());

        // Validate the Purchase in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPurchaseUpdatableFieldsEquals(partialUpdatedPurchase, getPersistedPurchase(partialUpdatedPurchase));
    }

    @Test
    @Transactional
    void patchNonExistingPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, purchaseDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(purchaseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(purchaseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPurchase() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchase.setId(longCount.incrementAndGet());

        // Create the Purchase
        PurchaseDTO purchaseDTO = purchaseMapper.toDto(purchase);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(purchaseDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Purchase in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePurchase() throws Exception {
        // Initialize the database
        insertedPurchase = purchaseRepository.saveAndFlush(purchase);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the purchase
        restPurchaseMockMvc
            .perform(delete(ENTITY_API_URL_ID, purchase.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return purchaseRepository.count();
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

    protected Purchase getPersistedPurchase(Purchase purchase) {
        return purchaseRepository.findById(purchase.getId()).orElseThrow();
    }

    protected void assertPersistedPurchaseToMatchAllProperties(Purchase expectedPurchase) {
        assertPurchaseAllPropertiesEquals(expectedPurchase, getPersistedPurchase(expectedPurchase));
    }

    protected void assertPersistedPurchaseToMatchUpdatableProperties(Purchase expectedPurchase) {
        assertPurchaseAllUpdatablePropertiesEquals(expectedPurchase, getPersistedPurchase(expectedPurchase));
    }
}
