package com.finance.app.web.rest;

import static com.finance.app.domain.ItemAsserts.*;
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
import com.finance.app.domain.Item;
import com.finance.app.repository.ItemRepository;
import com.finance.app.service.ItemService;
import com.finance.app.service.dto.ItemDTO;
import com.finance.app.service.mapper.ItemMapper;
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
 * Integration tests for the {@link ItemResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ItemResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_SKU = "AAAAAAAAAA";
    private static final String UPDATED_SKU = "BBBBBBBBBB";

    private static final String DEFAULT_TYPE = "AAAAAAAAAA";
    private static final String UPDATED_TYPE = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_SELLING_PRICE = new BigDecimal(0);
    private static final BigDecimal UPDATED_SELLING_PRICE = new BigDecimal(1);
    private static final BigDecimal SMALLER_SELLING_PRICE = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_PURCHASE_PRICE = new BigDecimal(0);
    private static final BigDecimal UPDATED_PURCHASE_PRICE = new BigDecimal(1);
    private static final BigDecimal SMALLER_PURCHASE_PRICE = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_TAX_PERCENT = new BigDecimal(0);
    private static final BigDecimal UPDATED_TAX_PERCENT = new BigDecimal(1);
    private static final BigDecimal SMALLER_TAX_PERCENT = new BigDecimal(0 - 1);

    private static final String DEFAULT_UNIT = "AAAAAAAAAA";
    private static final String UPDATED_UNIT = "BBBBBBBBBB";

    private static final Boolean DEFAULT_ACTIVE = false;
    private static final Boolean UPDATED_ACTIVE = true;

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_OPENING_STOCK = new BigDecimal(0);
    private static final BigDecimal UPDATED_OPENING_STOCK = new BigDecimal(1);
    private static final BigDecimal SMALLER_OPENING_STOCK = new BigDecimal(0 - 1);

    private static final BigDecimal DEFAULT_REORDER_LEVEL = new BigDecimal(0);
    private static final BigDecimal UPDATED_REORDER_LEVEL = new BigDecimal(1);
    private static final BigDecimal SMALLER_REORDER_LEVEL = new BigDecimal(0 - 1);

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/items";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ItemRepository itemRepository;

    @Mock
    private ItemRepository itemRepositoryMock;

    @Autowired
    private ItemMapper itemMapper;

    @Mock
    private ItemService itemServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restItemMockMvc;

    private Item item;

    private Item insertedItem;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Item createEntity() {
        return new Item()
            .name(DEFAULT_NAME)
            .sku(DEFAULT_SKU)
            .type(DEFAULT_TYPE)
            .sellingPrice(DEFAULT_SELLING_PRICE)
            .purchasePrice(DEFAULT_PURCHASE_PRICE)
            .taxPercent(DEFAULT_TAX_PERCENT)
            .unit(DEFAULT_UNIT)
            .active(DEFAULT_ACTIVE)
            .deleted(DEFAULT_DELETED)
            .description(DEFAULT_DESCRIPTION)
            .openingStock(DEFAULT_OPENING_STOCK)
            .reorderLevel(DEFAULT_REORDER_LEVEL)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Item createUpdatedEntity() {
        return new Item()
            .name(UPDATED_NAME)
            .sku(UPDATED_SKU)
            .type(UPDATED_TYPE)
            .sellingPrice(UPDATED_SELLING_PRICE)
            .purchasePrice(UPDATED_PURCHASE_PRICE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .unit(UPDATED_UNIT)
            .active(UPDATED_ACTIVE)
            .deleted(UPDATED_DELETED)
            .description(UPDATED_DESCRIPTION)
            .openingStock(UPDATED_OPENING_STOCK)
            .reorderLevel(UPDATED_REORDER_LEVEL)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        item = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedItem != null) {
            itemRepository.delete(insertedItem);
            insertedItem = null;
        }
    }

    @Test
    @Transactional
    void createItem() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);
        var returnedItemDTO = om.readValue(
            restItemMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ItemDTO.class
        );

        // Validate the Item in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedItem = itemMapper.toEntity(returnedItemDTO);
        assertItemUpdatableFieldsEquals(returnedItem, getPersistedItem(returnedItem));

        insertedItem = returnedItem;
    }

    @Test
    @Transactional
    void createItemWithExistingId() throws Exception {
        // Create the Item with an existing ID
        item.setId(1L);
        ItemDTO itemDTO = itemMapper.toDto(item);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setName(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTypeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setType(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSellingPriceIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setSellingPrice(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxPercentIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setTaxPercent(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkUnitIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setUnit(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkActiveIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setActive(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        item.setCreatedAt(null);

        // Create the Item, which fails.
        ItemDTO itemDTO = itemMapper.toDto(item);

        restItemMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllItems() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList
        restItemMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(item.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].sku").value(hasItem(DEFAULT_SKU)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE)))
            .andExpect(jsonPath("$.[*].sellingPrice").value(hasItem(sameNumber(DEFAULT_SELLING_PRICE))))
            .andExpect(jsonPath("$.[*].purchasePrice").value(hasItem(sameNumber(DEFAULT_PURCHASE_PRICE))))
            .andExpect(jsonPath("$.[*].taxPercent").value(hasItem(sameNumber(DEFAULT_TAX_PERCENT))))
            .andExpect(jsonPath("$.[*].unit").value(hasItem(DEFAULT_UNIT)))
            .andExpect(jsonPath("$.[*].active").value(hasItem(DEFAULT_ACTIVE)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].openingStock").value(hasItem(sameNumber(DEFAULT_OPENING_STOCK))))
            .andExpect(jsonPath("$.[*].reorderLevel").value(hasItem(sameNumber(DEFAULT_REORDER_LEVEL))))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllItemsWithEagerRelationshipsIsEnabled() throws Exception {
        when(itemServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restItemMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(itemServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllItemsWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(itemServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restItemMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(itemRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getItem() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get the item
        restItemMockMvc
            .perform(get(ENTITY_API_URL_ID, item.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(item.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.sku").value(DEFAULT_SKU))
            .andExpect(jsonPath("$.type").value(DEFAULT_TYPE))
            .andExpect(jsonPath("$.sellingPrice").value(sameNumber(DEFAULT_SELLING_PRICE)))
            .andExpect(jsonPath("$.purchasePrice").value(sameNumber(DEFAULT_PURCHASE_PRICE)))
            .andExpect(jsonPath("$.taxPercent").value(sameNumber(DEFAULT_TAX_PERCENT)))
            .andExpect(jsonPath("$.unit").value(DEFAULT_UNIT))
            .andExpect(jsonPath("$.active").value(DEFAULT_ACTIVE))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
            .andExpect(jsonPath("$.openingStock").value(sameNumber(DEFAULT_OPENING_STOCK)))
            .andExpect(jsonPath("$.reorderLevel").value(sameNumber(DEFAULT_REORDER_LEVEL)))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getItemsByIdFiltering() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        Long id = item.getId();

        defaultItemFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultItemFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultItemFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllItemsByNameIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where name equals to
        defaultItemFiltering("name.equals=" + DEFAULT_NAME, "name.equals=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllItemsByNameIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where name in
        defaultItemFiltering("name.in=" + DEFAULT_NAME + "," + UPDATED_NAME, "name.in=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllItemsByNameIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where name is not null
        defaultItemFiltering("name.specified=true", "name.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByNameContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where name contains
        defaultItemFiltering("name.contains=" + DEFAULT_NAME, "name.contains=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllItemsByNameNotContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where name does not contain
        defaultItemFiltering("name.doesNotContain=" + UPDATED_NAME, "name.doesNotContain=" + DEFAULT_NAME);
    }

    @Test
    @Transactional
    void getAllItemsBySkuIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sku equals to
        defaultItemFiltering("sku.equals=" + DEFAULT_SKU, "sku.equals=" + UPDATED_SKU);
    }

    @Test
    @Transactional
    void getAllItemsBySkuIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sku in
        defaultItemFiltering("sku.in=" + DEFAULT_SKU + "," + UPDATED_SKU, "sku.in=" + UPDATED_SKU);
    }

    @Test
    @Transactional
    void getAllItemsBySkuIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sku is not null
        defaultItemFiltering("sku.specified=true", "sku.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsBySkuContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sku contains
        defaultItemFiltering("sku.contains=" + DEFAULT_SKU, "sku.contains=" + UPDATED_SKU);
    }

    @Test
    @Transactional
    void getAllItemsBySkuNotContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sku does not contain
        defaultItemFiltering("sku.doesNotContain=" + UPDATED_SKU, "sku.doesNotContain=" + DEFAULT_SKU);
    }

    @Test
    @Transactional
    void getAllItemsByTypeIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where type equals to
        defaultItemFiltering("type.equals=" + DEFAULT_TYPE, "type.equals=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllItemsByTypeIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where type in
        defaultItemFiltering("type.in=" + DEFAULT_TYPE + "," + UPDATED_TYPE, "type.in=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllItemsByTypeIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where type is not null
        defaultItemFiltering("type.specified=true", "type.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByTypeContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where type contains
        defaultItemFiltering("type.contains=" + DEFAULT_TYPE, "type.contains=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllItemsByTypeNotContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where type does not contain
        defaultItemFiltering("type.doesNotContain=" + UPDATED_TYPE, "type.doesNotContain=" + DEFAULT_TYPE);
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice equals to
        defaultItemFiltering("sellingPrice.equals=" + DEFAULT_SELLING_PRICE, "sellingPrice.equals=" + UPDATED_SELLING_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice in
        defaultItemFiltering(
            "sellingPrice.in=" + DEFAULT_SELLING_PRICE + "," + UPDATED_SELLING_PRICE,
            "sellingPrice.in=" + UPDATED_SELLING_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice is not null
        defaultItemFiltering("sellingPrice.specified=true", "sellingPrice.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice is greater than or equal to
        defaultItemFiltering(
            "sellingPrice.greaterThanOrEqual=" + DEFAULT_SELLING_PRICE,
            "sellingPrice.greaterThanOrEqual=" + UPDATED_SELLING_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice is less than or equal to
        defaultItemFiltering(
            "sellingPrice.lessThanOrEqual=" + DEFAULT_SELLING_PRICE,
            "sellingPrice.lessThanOrEqual=" + SMALLER_SELLING_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice is less than
        defaultItemFiltering("sellingPrice.lessThan=" + UPDATED_SELLING_PRICE, "sellingPrice.lessThan=" + DEFAULT_SELLING_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsBySellingPriceIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where sellingPrice is greater than
        defaultItemFiltering("sellingPrice.greaterThan=" + SMALLER_SELLING_PRICE, "sellingPrice.greaterThan=" + DEFAULT_SELLING_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice equals to
        defaultItemFiltering("purchasePrice.equals=" + DEFAULT_PURCHASE_PRICE, "purchasePrice.equals=" + UPDATED_PURCHASE_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice in
        defaultItemFiltering(
            "purchasePrice.in=" + DEFAULT_PURCHASE_PRICE + "," + UPDATED_PURCHASE_PRICE,
            "purchasePrice.in=" + UPDATED_PURCHASE_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice is not null
        defaultItemFiltering("purchasePrice.specified=true", "purchasePrice.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice is greater than or equal to
        defaultItemFiltering(
            "purchasePrice.greaterThanOrEqual=" + DEFAULT_PURCHASE_PRICE,
            "purchasePrice.greaterThanOrEqual=" + UPDATED_PURCHASE_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice is less than or equal to
        defaultItemFiltering(
            "purchasePrice.lessThanOrEqual=" + DEFAULT_PURCHASE_PRICE,
            "purchasePrice.lessThanOrEqual=" + SMALLER_PURCHASE_PRICE
        );
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice is less than
        defaultItemFiltering("purchasePrice.lessThan=" + UPDATED_PURCHASE_PRICE, "purchasePrice.lessThan=" + DEFAULT_PURCHASE_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsByPurchasePriceIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where purchasePrice is greater than
        defaultItemFiltering("purchasePrice.greaterThan=" + SMALLER_PURCHASE_PRICE, "purchasePrice.greaterThan=" + DEFAULT_PURCHASE_PRICE);
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent equals to
        defaultItemFiltering("taxPercent.equals=" + DEFAULT_TAX_PERCENT, "taxPercent.equals=" + UPDATED_TAX_PERCENT);
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent in
        defaultItemFiltering("taxPercent.in=" + DEFAULT_TAX_PERCENT + "," + UPDATED_TAX_PERCENT, "taxPercent.in=" + UPDATED_TAX_PERCENT);
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent is not null
        defaultItemFiltering("taxPercent.specified=true", "taxPercent.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent is greater than or equal to
        defaultItemFiltering(
            "taxPercent.greaterThanOrEqual=" + DEFAULT_TAX_PERCENT,
            "taxPercent.greaterThanOrEqual=" + (DEFAULT_TAX_PERCENT.add(BigDecimal.ONE))
        );
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent is less than or equal to
        defaultItemFiltering("taxPercent.lessThanOrEqual=" + DEFAULT_TAX_PERCENT, "taxPercent.lessThanOrEqual=" + SMALLER_TAX_PERCENT);
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent is less than
        defaultItemFiltering(
            "taxPercent.lessThan=" + (DEFAULT_TAX_PERCENT.add(BigDecimal.ONE)),
            "taxPercent.lessThan=" + DEFAULT_TAX_PERCENT
        );
    }

    @Test
    @Transactional
    void getAllItemsByTaxPercentIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where taxPercent is greater than
        defaultItemFiltering("taxPercent.greaterThan=" + SMALLER_TAX_PERCENT, "taxPercent.greaterThan=" + DEFAULT_TAX_PERCENT);
    }

    @Test
    @Transactional
    void getAllItemsByUnitIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where unit equals to
        defaultItemFiltering("unit.equals=" + DEFAULT_UNIT, "unit.equals=" + UPDATED_UNIT);
    }

    @Test
    @Transactional
    void getAllItemsByUnitIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where unit in
        defaultItemFiltering("unit.in=" + DEFAULT_UNIT + "," + UPDATED_UNIT, "unit.in=" + UPDATED_UNIT);
    }

    @Test
    @Transactional
    void getAllItemsByUnitIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where unit is not null
        defaultItemFiltering("unit.specified=true", "unit.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByUnitContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where unit contains
        defaultItemFiltering("unit.contains=" + DEFAULT_UNIT, "unit.contains=" + UPDATED_UNIT);
    }

    @Test
    @Transactional
    void getAllItemsByUnitNotContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where unit does not contain
        defaultItemFiltering("unit.doesNotContain=" + UPDATED_UNIT, "unit.doesNotContain=" + DEFAULT_UNIT);
    }

    @Test
    @Transactional
    void getAllItemsByActiveIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where active equals to
        defaultItemFiltering("active.equals=" + DEFAULT_ACTIVE, "active.equals=" + UPDATED_ACTIVE);
    }

    @Test
    @Transactional
    void getAllItemsByActiveIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where active in
        defaultItemFiltering("active.in=" + DEFAULT_ACTIVE + "," + UPDATED_ACTIVE, "active.in=" + UPDATED_ACTIVE);
    }

    @Test
    @Transactional
    void getAllItemsByActiveIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where active is not null
        defaultItemFiltering("active.specified=true", "active.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where deleted equals to
        defaultItemFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllItemsByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where deleted in
        defaultItemFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllItemsByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where deleted is not null
        defaultItemFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByDescriptionIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where description equals to
        defaultItemFiltering("description.equals=" + DEFAULT_DESCRIPTION, "description.equals=" + UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void getAllItemsByDescriptionIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where description in
        defaultItemFiltering("description.in=" + DEFAULT_DESCRIPTION + "," + UPDATED_DESCRIPTION, "description.in=" + UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void getAllItemsByDescriptionIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where description is not null
        defaultItemFiltering("description.specified=true", "description.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByDescriptionContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where description contains
        defaultItemFiltering("description.contains=" + DEFAULT_DESCRIPTION, "description.contains=" + UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void getAllItemsByDescriptionNotContainsSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where description does not contain
        defaultItemFiltering("description.doesNotContain=" + UPDATED_DESCRIPTION, "description.doesNotContain=" + DEFAULT_DESCRIPTION);
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock equals to
        defaultItemFiltering("openingStock.equals=" + DEFAULT_OPENING_STOCK, "openingStock.equals=" + UPDATED_OPENING_STOCK);
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock in
        defaultItemFiltering(
            "openingStock.in=" + DEFAULT_OPENING_STOCK + "," + UPDATED_OPENING_STOCK,
            "openingStock.in=" + UPDATED_OPENING_STOCK
        );
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock is not null
        defaultItemFiltering("openingStock.specified=true", "openingStock.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock is greater than or equal to
        defaultItemFiltering(
            "openingStock.greaterThanOrEqual=" + DEFAULT_OPENING_STOCK,
            "openingStock.greaterThanOrEqual=" + UPDATED_OPENING_STOCK
        );
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock is less than or equal to
        defaultItemFiltering(
            "openingStock.lessThanOrEqual=" + DEFAULT_OPENING_STOCK,
            "openingStock.lessThanOrEqual=" + SMALLER_OPENING_STOCK
        );
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock is less than
        defaultItemFiltering("openingStock.lessThan=" + UPDATED_OPENING_STOCK, "openingStock.lessThan=" + DEFAULT_OPENING_STOCK);
    }

    @Test
    @Transactional
    void getAllItemsByOpeningStockIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where openingStock is greater than
        defaultItemFiltering("openingStock.greaterThan=" + SMALLER_OPENING_STOCK, "openingStock.greaterThan=" + DEFAULT_OPENING_STOCK);
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel equals to
        defaultItemFiltering("reorderLevel.equals=" + DEFAULT_REORDER_LEVEL, "reorderLevel.equals=" + UPDATED_REORDER_LEVEL);
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel in
        defaultItemFiltering(
            "reorderLevel.in=" + DEFAULT_REORDER_LEVEL + "," + UPDATED_REORDER_LEVEL,
            "reorderLevel.in=" + UPDATED_REORDER_LEVEL
        );
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel is not null
        defaultItemFiltering("reorderLevel.specified=true", "reorderLevel.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel is greater than or equal to
        defaultItemFiltering(
            "reorderLevel.greaterThanOrEqual=" + DEFAULT_REORDER_LEVEL,
            "reorderLevel.greaterThanOrEqual=" + UPDATED_REORDER_LEVEL
        );
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel is less than or equal to
        defaultItemFiltering(
            "reorderLevel.lessThanOrEqual=" + DEFAULT_REORDER_LEVEL,
            "reorderLevel.lessThanOrEqual=" + SMALLER_REORDER_LEVEL
        );
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel is less than
        defaultItemFiltering("reorderLevel.lessThan=" + UPDATED_REORDER_LEVEL, "reorderLevel.lessThan=" + DEFAULT_REORDER_LEVEL);
    }

    @Test
    @Transactional
    void getAllItemsByReorderLevelIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where reorderLevel is greater than
        defaultItemFiltering("reorderLevel.greaterThan=" + SMALLER_REORDER_LEVEL, "reorderLevel.greaterThan=" + DEFAULT_REORDER_LEVEL);
    }

    @Test
    @Transactional
    void getAllItemsByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where createdAt equals to
        defaultItemFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllItemsByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where createdAt in
        defaultItemFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllItemsByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where createdAt is not null
        defaultItemFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where updatedAt equals to
        defaultItemFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllItemsByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where updatedAt in
        defaultItemFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllItemsByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        // Get all the itemList where updatedAt is not null
        defaultItemFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllItemsByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            itemRepository.saveAndFlush(item);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        item.setBusiness(business);
        itemRepository.saveAndFlush(item);
        Long businessId = business.getId();
        // Get all the itemList where business equals to businessId
        defaultItemShouldBeFound("businessId.equals=" + businessId);

        // Get all the itemList where business equals to (businessId + 1)
        defaultItemShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    private void defaultItemFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultItemShouldBeFound(shouldBeFound);
        defaultItemShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultItemShouldBeFound(String filter) throws Exception {
        restItemMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(item.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].sku").value(hasItem(DEFAULT_SKU)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE)))
            .andExpect(jsonPath("$.[*].sellingPrice").value(hasItem(sameNumber(DEFAULT_SELLING_PRICE))))
            .andExpect(jsonPath("$.[*].purchasePrice").value(hasItem(sameNumber(DEFAULT_PURCHASE_PRICE))))
            .andExpect(jsonPath("$.[*].taxPercent").value(hasItem(sameNumber(DEFAULT_TAX_PERCENT))))
            .andExpect(jsonPath("$.[*].unit").value(hasItem(DEFAULT_UNIT)))
            .andExpect(jsonPath("$.[*].active").value(hasItem(DEFAULT_ACTIVE)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].openingStock").value(hasItem(sameNumber(DEFAULT_OPENING_STOCK))))
            .andExpect(jsonPath("$.[*].reorderLevel").value(hasItem(sameNumber(DEFAULT_REORDER_LEVEL))))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restItemMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultItemShouldNotBeFound(String filter) throws Exception {
        restItemMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restItemMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingItem() throws Exception {
        // Get the item
        restItemMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingItem() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the item
        Item updatedItem = itemRepository.findById(item.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedItem are not directly saved in db
        em.detach(updatedItem);
        updatedItem
            .name(UPDATED_NAME)
            .sku(UPDATED_SKU)
            .type(UPDATED_TYPE)
            .sellingPrice(UPDATED_SELLING_PRICE)
            .purchasePrice(UPDATED_PURCHASE_PRICE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .unit(UPDATED_UNIT)
            .active(UPDATED_ACTIVE)
            .deleted(UPDATED_DELETED)
            .description(UPDATED_DESCRIPTION)
            .openingStock(UPDATED_OPENING_STOCK)
            .reorderLevel(UPDATED_REORDER_LEVEL)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        ItemDTO itemDTO = itemMapper.toDto(updatedItem);

        restItemMockMvc
            .perform(put(ENTITY_API_URL_ID, itemDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isOk());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedItemToMatchAllProperties(updatedItem);
    }

    @Test
    @Transactional
    void putNonExistingItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(put(ENTITY_API_URL_ID, itemDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(itemDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateItemWithPatch() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the item using partial update
        Item partialUpdatedItem = new Item();
        partialUpdatedItem.setId(item.getId());

        partialUpdatedItem
            .type(UPDATED_TYPE)
            .sellingPrice(UPDATED_SELLING_PRICE)
            .active(UPDATED_ACTIVE)
            .description(UPDATED_DESCRIPTION)
            .openingStock(UPDATED_OPENING_STOCK)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restItemMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedItem.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedItem))
            )
            .andExpect(status().isOk());

        // Validate the Item in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertItemUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedItem, item), getPersistedItem(item));
    }

    @Test
    @Transactional
    void fullUpdateItemWithPatch() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the item using partial update
        Item partialUpdatedItem = new Item();
        partialUpdatedItem.setId(item.getId());

        partialUpdatedItem
            .name(UPDATED_NAME)
            .sku(UPDATED_SKU)
            .type(UPDATED_TYPE)
            .sellingPrice(UPDATED_SELLING_PRICE)
            .purchasePrice(UPDATED_PURCHASE_PRICE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .unit(UPDATED_UNIT)
            .active(UPDATED_ACTIVE)
            .deleted(UPDATED_DELETED)
            .description(UPDATED_DESCRIPTION)
            .openingStock(UPDATED_OPENING_STOCK)
            .reorderLevel(UPDATED_REORDER_LEVEL)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restItemMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedItem.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedItem))
            )
            .andExpect(status().isOk());

        // Validate the Item in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertItemUpdatableFieldsEquals(partialUpdatedItem, getPersistedItem(partialUpdatedItem));
    }

    @Test
    @Transactional
    void patchNonExistingItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, itemDTO.getId()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(itemDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(itemDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamItem() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        item.setId(longCount.incrementAndGet());

        // Create the Item
        ItemDTO itemDTO = itemMapper.toDto(item);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restItemMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(itemDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Item in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteItem() throws Exception {
        // Initialize the database
        insertedItem = itemRepository.saveAndFlush(item);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the item
        restItemMockMvc
            .perform(delete(ENTITY_API_URL_ID, item.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return itemRepository.count();
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

    protected Item getPersistedItem(Item item) {
        return itemRepository.findById(item.getId()).orElseThrow();
    }

    protected void assertPersistedItemToMatchAllProperties(Item expectedItem) {
        assertItemAllPropertiesEquals(expectedItem, getPersistedItem(expectedItem));
    }

    protected void assertPersistedItemToMatchUpdatableProperties(Item expectedItem) {
        assertItemAllUpdatablePropertiesEquals(expectedItem, getPersistedItem(expectedItem));
    }
}
