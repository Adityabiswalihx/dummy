import React, { ReactElement, useEffect, useRef, useState } from 'react';
import {
  Form, Table, Pagination, Button, Select,
  Row, Col, Skeleton, Empty, Tooltip, Checkbox,
} from 'antd';
import PageHeader from '../../../../shared/components/pageHeader/PageHeader';
import TagList from '../../../../shared/components/tags/tag';
import { useHistory } from 'react-router-dom';
import {
  actions,
  ADMISSION_TITLE, ALL,
  getDraftTableMapping,
  getInPatientTableMapping,
  INPATIENT_ACTIONS,
  PRIMARY_BUTTON_TYPE,
  renderDraftIPOptions,
  renderIPOptions,
  SEARCH_PLACEHOLDER,
  TABLE_SIZE_MIDDLE,
  treatmentDetail,
} from '../../../../shared/constants/crmConstants';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../store';
import {
  updateSelectedDetail, setFilterAction, fetchInPatientList, fetchTagListCount,
  bulkUploadClaims, searchInPatientList, setSortingPreference, setPageIndex,
  clearSearchDetail, saveInPatientConfig, nextStatusAction, nextStatusFilterAction,
  setCountClicked, setUpdateCourierDetailClicked,
  setIsDraftBtnClicked,
  setSelectedItem,
  fetchTotalClaimCount,
  setCourierUpdated, resetBulkUploadSelectedClaims, setBulkUploadSelectedClaims,
  deleteKeyfromBulkUploadSelectedClaims, setCenterIdList, setIsEasyDischargeCase,

} from '../../../../store/actions/inPatientAction';
import { setSideBarHeader } from '../../../../store/actions/leftSideBarAction';
import { base64UrlEncode, centeredNotification, canActivate } from '../../../../utils/utility';
import { authFeatureConstants, GUTTOR_SPACE, RPA_PAYER_NOT_CONFIGURED_ERR } from '../../../../shared/constants/commonConstants';
import {
  checkIfAnyTableSearchEnabled, customGTMEvent, getIsPageNameDetail, getIsPageNameEdit,
  getIsPageNameNewAdmission, getTableBasedOnConfig,
} from '../service/crmUtils';
import { ApplicationDetailModel } from '../../../../store/models/applicationDetailModel';
import TableConfigurator from '../../../../shared/components/TableConfigurator/TableConfigurator';
import { FormInstance } from 'antd/lib/form';
import { FilterOutlined } from '@ant-design/icons';
import './floatLabel.less';
import FilterAutoComplete from '../../../../shared/components/FilterAutocomplete/FilterAutoComplete';
import {
  fetchInPatientInsurerList, fetchInpatientStatusList, fetchLookupMaster,
} from '../../../../store/actions/lookUpAction';
import {
  fetchDraftList, lockUnlockOrDeleteDraft,
} from '../../../../store/actions/savedDraftAction';
import {
  getSelectedSearchType,
  setAdditionalAdmissionInfo, setAdmissionForm, setIsDraftSelected,
  setIsShowAdmissionForm, setNameAdharVerified, setPanField, setSelectedBeneficiary, setSelectedDraft, setUploadedFiles,
  updateDraftValue,
  updateModalFormValue, updatePackageSelection, setPLTMappedValue, setHospitalOtherRoomType, setsubmitDisabled,
  setSelectedOption, setPanNoVerified, setAdharVerified, setVoterIdVerified, setDlVerified, setPanVerified,
  setDraftFormValidated,
  setNonAvailableClassification,
  setSelectedDiscrepency,
  setBuddhimedSelectedFiles,
  setClassificationArray,
  setNonSelectedDiscrepency,
  setProbability,
  setSelectedMemberId,
  setMemberName,
  setMemberSearchId,
} from '../../../../store/actions/newAdmissionAction';
import moment from 'moment';
import { changePayer } from '../../../../store/actions/payerListAction';
import { setClaimData } from '../../../../store/actions/claimDetailsAction';
import TpaTaglist from '../../../../shared/components/tags/tpaTagList';
import InpatientListSubFilters from './InPatientSubFilters';
import TrackCourierModal from './TrackCourierModal';
import { getHospDetail, setUserAuthData } from '../../../../store/actions/authAction';
import ClaimCountHeader from '../../../../shared/components/tags/ClaimCountHeader';
import MultiselectDropdownCheckbox from '../../../../shared/components/MultiselectDropdown/MultiSelectDropdownCheckbox';
import { setPatientSearchDetail } from '../../../../store/actions/hospitalAction';
import clevertap from 'clevertap-web-sdk';
import { setSelectedPolicyDetail } from '../../../../store/actions/nhcxAction';
import { fetchPayerConfig } from '../../../../store/actions/mailBoxAction';
import { PayerInitialState } from '../../../../store/models/payerListModel';
import { Payer } from '../../../../shared/models/payer.model';
import { updateIsOnNotificationflow } from '../../../../store/actions/utilAction';
const List = (props: any): ReactElement => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [claimForm] = Form.useForm();
  const [trackCourierForm] = Form.useForm();
  // const { chartHeader } = useSelector((state: RootState): any => state?.sideBarHeader);

  const mounted = useRef(false);
  const [inPatientData, setInPatientData] = useState([] as any);
  const [draftData, setDraftData] = useState([] as any);
  const { Option } = Select;
  const [inPatientDataCount, setInPatientDataCount] = useState(-1);
  const [totalClaimCount, setTotalCount] = useState([] as any);
  const [draftDataCount, setDraftDataCount] = useState(-1);
  const [inPatientTagDataCount, setInPatientTagDataCount] = useState([] as any);
  const [inPatientColumns, setInPatientColumns] = useState([] as any);
  const [draftColumns, setDraftColumns] = useState([] as any);
  const [isColumnFilter, setIsColumnFilter] = useState(false);
  const [isTblLoading, setIsTblLoading] = useState(false);
  const [tpaTagListData, setTpaTagListData] = useState<any>({});
  const [totalFilterCount, setTotalFilterCount] = useState<any>({});
  const [isShowTrackCourierModal, setIsShowTrackCourierModal] = useState<boolean>(false);

  const {
    lookUp: { payerClaimStatuses = [], allInsurers = [] },
    util: { oldLocations = [] },
    savedDraft: { draftDeleteCounter },
  } = useSelector((state: RootState): any => state || {});
  const appDetail = useSelector((state: RootState): ApplicationDetailModel => state.applicationDetail);
  const providerID = useSelector((state: RootState): any => state.admissionDetails?.claimDetails?.providerId || {});
  const {
    isNextStatus, tpaNextStatus, timeFilter, tpaSecondaryFilter, badRequestCount,
    isCountClicked, bulkUploadSelectedClaims, updateCourierDetailClicked,
    filterAction, isSearchClicked, pageIndex, filters, sortingKey,
    isDraftBtnClicked, isGlobalFilter, selectedItem,
  } = useSelector((state: RootState): any => state?.selectedInPatientDetail || {});
  const { allPayers } = useSelector((state: RootState): PayerInitialState => state.payerList);
  claimForm.setFieldsValue(bulkUploadSelectedClaims);
  const [searchForm] = Form.useForm();
  const autoCompleteRef = React.createRef<any>();
  const [resetSelectedTag, setResetSelctedTag] = useState(false);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const inPatientTableMapping = getInPatientTableMapping(canActivate(authFeatureConstants.NEW_ADMISSION_BEHALF_OF_HOSPITALS));
  const draftTableMapping = getDraftTableMapping(canActivate(authFeatureConstants.NEW_ADMISSION_BEHALF_OF_HOSPITALS));
  const [resetBtnType, setResetBtnType] = useState<any>('default');
  const groupProviders = appDetail.getGroupProviders();
  const logOutClicked = useSelector(
    ({ hospital: { isLogOutClicked } }: any): any => isLogOutClicked,
  );

  useEffect((): any => {
    dispatch(setSideBarHeader(ALL));
    if (appDetail?.getProviderId()) {
      dispatch(fetchPayerConfig(appDetail?.getProviderId()));
    }
    mounted.current = true;
    if (
      oldLocations[0] &&
      !getIsPageNameDetail(oldLocations[0]) &&
      !getIsPageNameEdit(oldLocations[0]) &&
      !getIsPageNameNewAdmission(oldLocations[0])
    ) {
      dispatch(clearSearchDetail());
      dispatch(nextStatusAction(false));
    }
    if (!payerClaimStatuses || payerClaimStatuses.length === 0) {
      dispatch(fetchInpatientStatusList());
    }
    if (!allInsurers || allInsurers.length === 0) {
      dispatch(fetchInPatientInsurerList());
    }
    if (oldLocations[0] && (getIsPageNameDetail(oldLocations[0]) || getIsPageNameNewAdmission(oldLocations[0]))) {
      reloadTagCount();
    }
    return (): boolean => {
      return mounted.current = false;
    };
  }, []);
  useEffect((): void => {
    if (!updateCourierDetailClicked) {
      dispatch(nextStatusAction(false));
    }
  }, [updateCourierDetailClicked]);

  useEffect((): any => {
    dispatch(setIsEasyDischargeCase(false));
  }, []);

  useEffect((): any => {
    if (checkIfAnyTableSearchEnabled(filters, sortingKey)) {
      setIsColumnFilter(true);
    } else {
      setIsColumnFilter(false);
    }
  }, [filters, sortingKey]);

  useEffect((): void => {
    const providerId = filters['providerId'];
      dispatch(setCenterIdList(providerId));
      if (isCountClicked) {
        reloadTagCount();
    }
  }, [filters['providerId']]);

  useEffect((): any => {
    setLoaderStateValue();
    if ((((timeFilter && tpaNextStatus !== 'DRAFTCLAIM') || !isDraftBtnClicked) && logOutClicked === false) && (badRequestCount < 2)) {
      setIsTblLoading(true);
      dispatch(fetchInPatientList({
        getInPatientList,
      }));
      if (process.env.REACT_APP_IS_TPA_CLAIM_COUNT_FILTER === 'true' && (badRequestCount < 2)) {
        dispatch(fetchTotalClaimCount({
          getTotalCountList,
        }));
      }
    } else if (timeFilter || isDraftBtnClicked) {
      setIsTblLoading(true);
      fetchDraftData();
    }
  }, [timeFilter, tpaNextStatus, isSearchClicked, selectedItem, logOutClicked, badRequestCount]);

  useEffect((): any => {
    if (isDraftBtnClicked) {
      fetchDraftData();
    }
  }, [draftDeleteCounter]);

  useEffect((): any => {
    let checkBoxColumn: any = [];

    if (updateCourierDetailClicked) {
      claimForm.resetFields(); // resetting fields to uncheck previously selected Checkboxes
      if (Object.keys(bulkUploadSelectedClaims).length > 0) {
        const selectedClaimCount =
          Object.keys(bulkUploadSelectedClaims)
          ?.filter(
            (k: any): any =>
              bulkUploadSelectedClaims[k],
          ) || [];
        checkBoxColumn = [getCheckBoxColumn(selectedClaimCount?.length)];
      } else {
        checkBoxColumn = [getCheckBoxColumn(0)];
      }
    }

    const filteredTable = getTableBasedOnConfig(appDetail.getIPConfig(), inPatientTableMapping);
    setInPatientColumns(
      [
        ...checkBoxColumn,
        ...filteredTable,
        {
          key: 'action',
          render: renderIPOptions,
        },
      ]);

    const filteredDraftTable = getTableBasedOnConfig(appDetail.getIPConfig(), draftTableMapping);
    setDraftColumns(
      [...filteredDraftTable,
      {
        key: 'action',
        render: renderDraftIPOptions,
      },
      ]);
  }, [appDetail, updateCourierDetailClicked, bulkUploadSelectedClaims]);

  useEffect((): any => {
    if (logOutClicked === false) {
      dispatch(fetchTagListCount({
        getTagListCount, getTpaTagListCount, getTagFilterCount,
      }));
    }
  }, [draftDeleteCounter, logOutClicked]);

  useEffect((): any => {
    setResetBtnType(
      (
        isNextStatus || isColumnFilter || isGlobalFilter || filterAction !== ALL ||
        tpaNextStatus || timeFilter || tpaSecondaryFilter
      ) ? 'primary' : 'default',
    );
  }, [isColumnFilter, isNextStatus, filterAction, isGlobalFilter, tpaNextStatus, timeFilter, tpaSecondaryFilter]);

  const setLoaderStateValue = (): void => {
    setInPatientDataCount(-1);
    setInPatientData(null);
    if (draftDataCount > 0) {
      setDraftDataCount(-1);
    }
    setDraftData(null);
  };
  const pageChange = (pageNumber: any): any => {
    dispatch(setPageIndex(pageNumber));
    dispatch(searchInPatientList());
  };

  const changeAction = (selectedActionValue: any): void => {
    setLoaderStateValue();
    if (!selectedActionValue) {
      selectedActionValue = ALL;
    }
    dispatch(setFilterAction(selectedActionValue));
    dispatch(setPageIndex(1));
    dispatch(setSideBarHeader(selectedActionValue));
    dispatch(searchInPatientList());
    dispatch(nextStatusAction(false));
  };
  const changeNextFilterAction = (selectedActionValue: any): void => {
    setLoaderStateValue();
    if (!selectedActionValue) {
      selectedActionValue = ALL;
    }
    dispatch(nextStatusFilterAction(selectedActionValue));
    dispatch(setPageIndex(1));
    dispatch(setSideBarHeader(selectedActionValue));
    dispatch(searchInPatientList());
    dispatch(fetchTagListCount({ getTagListCount }));
  };
  const getTagListCount = (data: any): void => {
    setIsCountLoading(false);
    const { actionClaimCount, isSuccess, errors = [] } = data || {};
    if (isSuccess && mounted.current) {
      setInPatientTagDataCount(actionClaimCount);
    } else {
      setInPatientTagDataCount([]);
      centeredNotification(errors.join(',\n'));
    }
  };

  const getInPatientList = (data: any): void => {
    const { claimDetails, count, isSuccess, errors = [] } = data;
    if (isSuccess && mounted.current && claimDetails !== null) {
      claimDetails?.map((detail: any, index: number): void => {
        detail.key = index;
      });
      setInPatientData(claimDetails);
      setInPatientDataCount(count);
    } else {
      setInPatientData([]);
      setInPatientDataCount(count);
      centeredNotification(errors.join(',\n'));
    }
    setIsTblLoading(false);
  };
  const getTotalCountList = (data: any): void => {
    const { claimCounts, isSuccess, errors = [] } = data;
    if (isSuccess && mounted.current) {
      setTotalCount(claimCounts);
    } else {
      centeredNotification(errors.join(',\n'));
    }
    setIsTblLoading(false);
  };

  const fetchDraftData = (): void => {
    setIsTblLoading(true);
      dispatch(fetchDraftList({
        getDraftList,
      }));
  };

  const getDraftList = (data: any): void => {
    const {
      draftClaimDetails = [], count,
      isSuccess, errors = [],
    } = data;

    if (isSuccess && mounted.current) {
      draftClaimDetails.map((detail: any, index: number): void => {
        detail.key = index;
      });
      setDraftData(draftClaimDetails);
      setDraftDataCount(count);
    } else {
      setDraftData([]);
      setDraftDataCount(count);
      centeredNotification(errors.join(',\n'));
    }
    setIsTblLoading(false);
  };

  const getHospFailure = (errMsg: string): any => {
    centeredNotification(errMsg);
  };

  const getHospSuccess = (result: any): void => {
    dispatch(setUserAuthData(result));
  };

  const rowClick = async (event: any, record: any, index: any): Promise<void> => {
    if (record?.statusName === 'Pre Auth Query') {
      dispatch(updateIsOnNotificationflow(false));
    }
    if (isDraftBtnClicked) {
      customGTMEvent({
        event: 'Draft Submission: Select a draft',
        statusName: record?.statusName,
      });
      if (record.providerId && Array.isArray(groupProviders) && groupProviders.length) {
        const hospId = [];
        hospId?.push(record.providerId);
        await dispatch(getHospDetail(hospId, (result: any): void => getHospSuccess(result), getHospFailure));
      }
      const payerId = `${record?.payerId}${record?.productCode || ''}`;
      const isPayerConfigured = allPayers.find((ele: Payer): boolean => {
        return ele?.uniqueIdentifier === payerId;
      });
      if (!isPayerConfigured) {
        centeredNotification(RPA_PAYER_NOT_CONFIGURED_ERR);
      } else {
        setTimeout((): any => {
          const { draftId, islocked = false, lockedBy } = record;
          if (!islocked || lockedBy === Number(appDetail.getUserId())) {
            const parsedDraftData = record?.rawDraft?.length > 0 ? JSON.parse(record?.rawDraft) : {};
            const {
              newFormValue,
              payer,
              uploadedFiles,
              selectedBeneficiaryDetail,
              selectedPackage,
              modalFormValue = {},
              additionalAdmissionInfo,
              claimDetails,
              panCardField,
              submitDisabled,
              panVerified,
              selectedPatientDetail,
              selectedPolicyDetail,
              memberIdEntered,
              memberSearchId,
            } = parsedDraftData;
            const { providerId } = record;
            const {
              payerClaimNo, hospActionId, payerActualId,
              productCode,
            } = claimDetails;
            const isCancel = false;
            const uniquePayerId = `${payerActualId}${productCode || ''}`;
            const { dateOfBirth } = newFormValue?.customerDetail || {};
            const { dateOfAdmission, dateOfDischarge, dateOfInjury, deliveryDate, dateOfDiagnosis,
              vaccinationDate, dateOfCommencement, dobOfChild, lmp, dateOfExpiry,
              dateOfSurgery } = newFormValue[treatmentDetail] || {};
            if (dateOfAdmission) {
              newFormValue[treatmentDetail].dateOfAdmission = moment(dateOfAdmission);
              modalFormValue.dateOfAdmission = moment(dateOfAdmission);
            }
            if (dateOfDischarge) {
              newFormValue[treatmentDetail].dateOfDischarge = moment(dateOfDischarge);
              modalFormValue.dateOfDischarge = moment(dateOfDischarge);
            }
            if (dateOfDiagnosis) {
              newFormValue[treatmentDetail].dateOfDiagnosis = moment(dateOfDiagnosis);
              modalFormValue.dateOfDiagnosis = moment(dateOfDiagnosis);
            }
            if (dateOfInjury) {
              newFormValue[treatmentDetail].dateOfInjury = moment(dateOfInjury);
            }
            if (deliveryDate) {
              newFormValue[treatmentDetail].deliveryDate = moment(deliveryDate);
            }
            if (dateOfBirth) {
              newFormValue.customerDetail.dateOfBirth = moment(dateOfBirth);
            }
            if (vaccinationDate) {
              newFormValue[treatmentDetail].vaccinationDate = moment(vaccinationDate);
              modalFormValue.vaccinationDate = moment(vaccinationDate);
            }
            if (dateOfCommencement) {
              newFormValue[treatmentDetail].dateOfCommencement = moment(dateOfCommencement);
              modalFormValue.dateOfCommencement = moment(dateOfCommencement);
            }
            if (dobOfChild) {
              newFormValue[treatmentDetail].dobOfChild = moment(dobOfChild);
              modalFormValue.dobOfChild = moment(dobOfChild);
            }
            if (lmp) {
              newFormValue[treatmentDetail].lmp = moment(lmp);
              modalFormValue.lmp = moment(lmp);
            }
            if (dateOfExpiry) {
              newFormValue[treatmentDetail].dateOfExpiry = moment(dateOfExpiry);
              modalFormValue.dateOfExpiry = moment(dateOfExpiry);
            }
            if (dateOfSurgery) {
              newFormValue[treatmentDetail].dateOfSurgery = moment(dateOfSurgery);
              modalFormValue.dateOfSurgery = moment(dateOfSurgery);
            }
            newFormValue.customerDetail.hospitalCenter = providerId;
            newFormValue.customerDetail.payerId = `${payer?.value}`;
            dispatch(updateDraftValue(parsedDraftData?.draftKey));
            dispatch(setClaimData(claimDetails));
            dispatch(changePayer(payer));
            dispatch(setIsDraftSelected(true));
            dispatch(setSelectedDraft(record));
            dispatch(setSelectedOption(parsedDraftData?.selectedOption));
            dispatch(setPanVerified(panVerified));
            dispatch(setNameAdharVerified(parsedDraftData?.nameMatch));
            const verified = parsedDraftData?.selectedOption === 'PAN NO.' ?
              setPanNoVerified : parsedDraftData?.selectedOption === 'AADHAR ID' ?
                setAdharVerified : parsedDraftData?.selectedOption === 'Driving License' ?
                  setDlVerified : setVoterIdVerified;
            dispatch(verified(parsedDraftData?.isVerified));
            dispatch(getSelectedSearchType(parsedDraftData?.searchType));
            dispatch(setAdmissionForm(newFormValue));
            dispatch(setPLTMappedValue(parsedDraftData?.pltMappedValue));
            dispatch(setAdditionalAdmissionInfo(additionalAdmissionInfo));
            dispatch(setIsShowAdmissionForm(true));
            dispatch(setSelectedBeneficiary(selectedBeneficiaryDetail));
            dispatch(setUploadedFiles(uploadedFiles));
            dispatch(updatePackageSelection(selectedPackage));
            dispatch(updateModalFormValue(modalFormValue));
            dispatch(lockUnlockOrDeleteDraft({ draftId, isLocked: false })); // ipp-4277-removing lock status fro drafts
            dispatch(setHospitalOtherRoomType(parsedDraftData?.hospitalOtherRoomType));
            dispatch(setNonAvailableClassification(parsedDraftData?.nonAvailableClassification));
            dispatch(setSelectedDiscrepency(parsedDraftData?.selectedDiscrepency));
            dispatch(setBuddhimedSelectedFiles(parsedDraftData?.selectedFiles));
            dispatch(setClassificationArray(parsedDraftData?.classificationArray));
            dispatch(setNonSelectedDiscrepency(parsedDraftData?.nonSelectedDiscrepency));
            dispatch(setProbability(parsedDraftData?.showProbability));
            if (selectedPolicyDetail) {
              dispatch(setSelectedPolicyDetail(selectedPolicyDetail));
            }
            if (panCardField) {
              dispatch(setPanField(panCardField));
            }
            dispatch(setsubmitDisabled(submitDisabled));
            dispatch(setDraftFormValidated(!submitDisabled));
            dispatch(setPatientSearchDetail(selectedPatientDetail));
            dispatch(setSelectedMemberId(memberIdEntered));
            dispatch(setMemberName(newFormValue?.customerDetail?.fullName));
            dispatch(setMemberSearchId(memberSearchId));
            setTimeout((): void => {
              {
                parsedDraftData?.draftKey !== 'settlement' ?
                  newAdmissionRoute() :
                  history.push(`/claims/in-patient/detail/${base64UrlEncode(`${base64UrlEncode(payerClaimNo)}/${hospActionId}/${payerActualId}/${uniquePayerId}/${isCancel}/${providerID}`)}/edit/${base64UrlEncode(actions.CASHLESSSUMBIT)}`);
              }
            }, 10);
          } else {
            centeredNotification('Other user is currently working on this draft.');
          }
        }, 5);
      }
    } else {
      dispatch(updateSelectedDetail(record));
      const {
        payerClaimNo, hospActionId, payerId,
        productCode, providerId,
      } = record;
      const isCancel = false;
      const uniquePayerId = `${payerId}${productCode || ''}`;
      history.push(`/claims/in-patient/detail/${base64UrlEncode(`${base64UrlEncode(payerClaimNo)}/${hospActionId}/${payerId}/${uniquePayerId}/${isCancel}/${providerId}`)}`);
    }
  };

  const newAdmissionRoute = (): void => {
    clevertap.event.push('New Admission clicked', {
      testData: 'srimaraj',
    });
    dispatch(setCourierUpdated(false)); // clearing filters for updateCourier details bugfix-IPP-4052
    dispatch(setUpdateCourierDetailClicked(false));
    dispatch(resetBulkUploadSelectedClaims());
    dispatch(setPageIndex(1));
    history.push('/claims/in-patient/new-admission');
  };
  const blankArr = Array(10).fill(0);

  const handleTableChange = (...attributes: any): any => {
    const { columnKey: key, order: value } = attributes[2];
    const columnToUpdate = inPatientColumns.find(({ key: colKey }: any): boolean => colKey === key);
    if (value !== undefined) {
    columnToUpdate.sortOrder = value;
    setInPatientColumns([...inPatientColumns]);
    dispatch(setSortingPreference(value ? { key, value: String(value).toUpperCase() } : null));
    }
    dispatch(searchInPatientList());
  };
  const handleTableChangeDraft = (...attributes: any): any => {
    const { columnKey: key, order: value } = attributes[2];
    const columnToUpdate = draftColumns.find(({ key: colKey }: any): boolean => colKey === key);
    if (value !== undefined) {
    columnToUpdate.sortOrder = value;
    setDraftColumns([...draftColumns]);
    dispatch(setSortingPreference(value ? { key, value: String(value).toUpperCase() } : null));
    }
  };

  const onColumnEditSave = (form: FormInstance, setIsVisible: any): any => {
    dispatch(saveInPatientConfig(form.getFieldsValue(), setIsVisible, false, false));
  };

  const handleTag = (selectedTag: any): any => {
    dispatch(nextStatusAction(true));
    setIsColumnFilter(true);
    setResetSelctedTag(false);
    changeNextFilterAction(selectedTag);

    if (selectedTag === 'DRAFT') {
      return draftClickHandler();
    }
    dispatch(setIsDraftBtnClicked(false));
  };

  const resetFilter = (event: any, isFromButton?: boolean): any => {
    const updatedInPatientList =
      inPatientColumns
        .filter((ic: any): any =>
          ic?.key !== 'selected',
        )
        .map((ele: any): any => {
          ele.sortOrder = false;
          return ele;
        });
    claimForm.resetFields();
    setResetSelctedTag(true);
    dispatch(setIsDraftBtnClicked(false));
    setInPatientColumns([...updatedInPatientList]);
    searchForm.setFieldsValue({ searchValue: '' });
    autoCompleteRef?.current?.setSearchPlaceholder(SEARCH_PLACEHOLDER);
    autoCompleteRef?.current?.setFilterOptions([]);
    dispatch(setSelectedItem(''));
    dispatch(setCountClicked(true));
    if (isFromButton === true || groupProviders?.length === 0) {
      dispatch(clearSearchDetail());
      dispatch(setCountClicked(true)); // to
    } else {
      dispatch(setPageIndex(1));
      dispatch(nextStatusAction(false));
      if (isFromButton === false) {
        dispatch(setCountClicked(false));
      }
    }
    if (updateCourierDetailClicked) {
      setIsTblLoading(true);
      dispatch(fetchInPatientList({
        getInPatientList,
      }));
      dispatch(setUpdateCourierDetailClicked(false));
    }
  };

  const reloadTagCount = (): any => {
    resetInpatientListColumns();
    setIsCountLoading(true);
    dispatch(fetchTagListCount({
      getTagListCount, getTpaTagListCount, getTagFilterCount,
    }));
    dispatch(setCountClicked(true));
  };

  const resetInpatientListColumns = (): void => {
    const updatedInPatientColumns =
      inPatientColumns
        ?.filter(
          (ic: any): any =>
            ic?.key !== 'selected',
        );
    setInPatientColumns(updatedInPatientColumns);
  };

  const getTpaTagListCount = (data: any): any => {
    setIsCountLoading(false);
    setTpaTagListData(data);
  };
  const getTagFilterCount = (data: any): any => {
    setIsCountLoading(false);
    setTotalFilterCount(data);
  };

  const draftClickHandler = (): void => {
    dispatch(setIsDraftBtnClicked(true));
    if (!(groupProviders?.length > 0)) {
      if (!isDraftBtnClicked) {
        fetchDraftData();
      }
    }
  };

  const getSelectedClaims = (): any => {
    return Object.keys(bulkUploadSelectedClaims || {})
      ?.filter(
        (k: any): any =>
        bulkUploadSelectedClaims[k]      );
  };

  const getCheckBoxColumn = (selectedClaimCount: number): any => {
    return {
        title: <div className="circle">{selectedClaimCount}</div>,
        dataIndex: 'selected',
        key: 'selected',
        className: 'text-elipsis',
        render: (text: any, row: any): any => (
          <div onClick={selectedClickHandler}>
            <Form.Item
              name={`${row.hospActionId}_${row.payerId}_${row.productCode}`}
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
          </div>
        ),
       };
     };

  const setCheckBoxColumnInTable = (selectedClaimCount: number): void => {
    const filteredTable = getTableBasedOnConfig(appDetail.getIPConfig(), inPatientTableMapping);
    const updatedColumns: any = [
      getCheckBoxColumn(selectedClaimCount),
      ...filteredTable,
        {
         key: 'action',
         render: renderIPOptions,
        },
    ];
    setInPatientColumns(updatedColumns);

  };

  const selectedClickHandler = (e: any): any => { // to select or deselect the claims on rowClick or checkbox
    if (bulkUploadSelectedClaims[`${e?.hospActionId}_${e?.payerId}_${e?.productCode}`] !== true) {
      if (e.hospActionId !== undefined) {
        const selectedClaimObj = {[`${e?.hospActionId}_${e?.payerId}_${e?.productCode}`]: true };
        dispatch(setBulkUploadSelectedClaims(selectedClaimObj));
      }
    } else {
      dispatch(deleteKeyfromBulkUploadSelectedClaims([`${e?.hospActionId}_${e?.payerId}_${e?.productCode}`]));
    }
    const selectedClaims = getSelectedClaims();
    setCheckBoxColumnInTable(selectedClaims?.length);
  };

  const setSelectColumnAndFetchInitiateSettlement = (): void => {
    const selectedClaimCount =
      Object.keys(bulkUploadSelectedClaims)
        ?.filter(
          (k: any): any =>
            bulkUploadSelectedClaims[k],
        ) || [];
    dispatch(fetchInPatientList({
      getInPatientList,
    }));
    //  fetchInitiateSettlement();
    setCheckBoxColumnInTable(selectedClaimCount?.length);
  };

  const updateCourierStatusBtnClickHandler = (): void => {
    if (updateCourierDetailClicked) {
      const selectedClaims = getSelectedClaims();
      if (selectedClaims?.length > 0) {
        dispatch(fetchLookupMaster());
        setIsShowTrackCourierModal(true);
      } else {
        centeredNotification('Please select at least one claim !');
      }
    } else {
      dispatch(setPageIndex(1));
      dispatch(setCourierUpdated(true));
      dispatch(setUpdateCourierDetailClicked(true));
      setSelectColumnAndFetchInitiateSettlement();
    }
  };

  const trackCourierFormSubmitHandler = (data: any): void => {
    const selectedClaims = getSelectedClaims();

    let courierServiceRequestDetails: any = [];
    selectedClaims?.map((formData: any): any => {
      const dataArray = formData?.split('_');
      const productCode =
        dataArray?.[2] !== 'null' &&
        dataArray?.[2] !== 'undefined'
          ? dataArray?.[2] : null;

          courierServiceRequestDetails = [
        ...courierServiceRequestDetails,
        {
          hospActionId: Number(dataArray?.[0]),
          payerId: Number(dataArray?.[1]),
          productCode,
          payerClaimExtensionFields: [
            {
               fieldName: 'courierTrackId',
               fieldValue: data?.courierReceiptNumber || data?.courierTrackId,
            },
            {
               fieldName: 'courierProvider',
               fieldValue: data?.otherCourierProvider || data?.courierProvider,
            },
          ],
        },
      ];
    });

    const payload = {
      // action: 'CASHLESSSUMBIT', removed as we are not performing settlement on courier update
      courierServiceRequestDetails,
    };
    dispatch(
      bulkUploadClaims(
        payload,
        (): void => {
          setIsShowTrackCourierModal(false);
          dispatch(resetBulkUploadSelectedClaims()); // to clear the bulkUploadSelectedClaims
          claimForm.resetFields();
          trackCourierForm.resetFields();
          dispatch(fetchInPatientList({
            getInPatientList,
          }));
        },
      ));
  };

  return <>
    <PageHeader
      pageTitle={ADMISSION_TITLE}

      rightComponent={
        (): ReactElement =>
          <Form
            form={searchForm}>
            <Row gutter={GUTTOR_SPACE} justify="end" className={groupProviders?.length > 0   ? 'row-container-ip' : ''}>
              {
                groupProviders?.length > 0 && process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'false' &&
                <Col md={5}>
                  <Select
                    className="w-100"
                    data-testid="inpatient-filter"
                    showSearch={true}
                    placeholder="Status"
                    optionFilterProp="children"
                    defaultValue={filterAction}
                    onChange={changeAction}
                    filterOption={(input: any, option: any): any =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {
                      INPATIENT_ACTIONS.map((actionVal: string, index: number): any =>
                        <Option value={actionVal} key={index} data-testid={'status-' + actionVal}>{actionVal}</Option>)
                    }
                  </Select>
                </Col>
              }
              {
                groupProviders?.length > 0  && process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'true' &&
                <Col className="center-search" md={8}>
                <Form.Item>
                  <MultiselectDropdownCheckbox
                  placeholder={'Search or Select Center'}
                  options={groupProviders}
                  value={ filters['providerId']}
                  reload={reloadTagCount}/>
                </Form.Item>
                </Col>
              }
              { groupProviders?.length > 0 && process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'false' &&
                <Col md={4}>
                  <FilterAutoComplete
                    setLoaderStateValue={setLoaderStateValue}
                    ref={autoCompleteRef}
                    form={searchForm} />
                </Col>
              }
              {
                groupProviders?.length > 0 && process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'false' &&
                <Col>
                  <Tooltip title="Reset filter" mouseEnterDelay={0.25}>
                    <Button
                      data-testid="clear-filter"
                      onClick={(event: any): any => resetFilter(event, true)}
                      type={resetBtnType}
                      icon={<FilterOutlined />}
                    />
                  </Tooltip>
                </Col>
              }
              {
                groupProviders?.length > 0 && process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'false' &&
                <Col>
                  <TableConfigurator
                    tableMapping={inPatientTableMapping}
                    saveClickHandler={onColumnEditSave}
                    configuration={appDetail.getIPConfig()} />
                </Col>
              }
              {
                !(groupProviders?.length > 0) && process.env.REACT_APP_IS_TPA_CLAIM_COUNT_FILTER === 'true' &&
                <ClaimCountHeader
                  selectedItem={selectedItem}
                  totalClaimCount={totalClaimCount}
                  filters={filters}
                  resetFilter={resetFilter}/>
              }
              <Col className={groupProviders?.length > 0  ? 'courier-btn' : ''}>
                  <Form.Item>
                  <Button
                    className={!(groupProviders?.length > 0) ? (updateCourierDetailClicked ? 'btn-blink arrow-button' : 'ghost-primary-btn arrow-button')
                      : (updateCourierDetailClicked ? 'btn-blink' : 'ghost-primary-btn')}
                    onClick={updateCourierStatusBtnClickHandler}
                    type="ghost"
                  >
                    {updateCourierDetailClicked ? `Enter` : `Update`} Courier Details
                  </Button>
                  </Form.Item>
                </Col>
              {
                canActivate(authFeatureConstants.NEW_ADMISSION) &&
                <Col className={groupProviders?.length > 0  ? 'new-btn' : ''}>
                  <Form.Item>
                      <Button
                        className={!(groupProviders?.length > 0) ? 'arrow-button' : ''}
                        data-testid="new-admission"
                        type={PRIMARY_BUTTON_TYPE}
                        onClick={newAdmissionRoute}
                      >
                      <p id="WA_NEW_ADMISSION">New admission</p>
                    </Button>
                  </Form.Item>
                </Col>
              }
            </Row>
          </Form>}
    />

    <Row className={process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'true' ? '' : groupProviders?.length > 0 ?  'inpatient-tag-holder' : ''}>
      {
        process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'true' ?
           <TpaTaglist
            reloadTagCount={reloadTagCount}
            data={tpaTagListData}
            handleDraft={handleTag}
            resetFilter={resetFilter}
            resetSelectedTagData = {resetSelectedTag}
            status= {isSearchClicked}
            isRefreshLoading={isCountLoading}
            buttonType={resetBtnType}
          />
      :
      groupProviders?.length > 0 ? <TagList
            data-testid="taglist-filter"
            tagCount={inPatientTagDataCount}
            selectedTag={handleTag}
            resetTag={resetSelectedTag}
            reloadTagCount={reloadTagCount}
            isRefreshLoading={isCountLoading}
            draftCount = {draftDataCount}
          /> :  <TpaTaglist
          reloadTagCount={reloadTagCount}
          data={tpaTagListData}
          handleDraft={handleTag}
          resetFilter={resetFilter}
          resetSelectedTagData = {resetSelectedTag}
          status= {isSearchClicked}
          isRefreshLoading={isCountLoading}
          buttonType={resetBtnType}
        />
      }
    </Row>

    <div className="ant-tabs-content-holder tab-custom-container">
      {
     (process.env.REACT_APP_IS_TPA_DASHBOARD_DISABLED === 'true') ?
        <InpatientListSubFilters
          inPatientTableMapping={inPatientTableMapping}
          onColumnEditSave={onColumnEditSave}
          buttonType={resetBtnType}
          setLoaderStateValue={setLoaderStateValue}
          autoCompleteRef={autoCompleteRef}
          searchForm={searchForm}
          isRefreshLoading={isCountLoading}
          reloadTagCount={reloadTagCount}
          resetFilter={resetFilter}
          secondaryFilterData={tpaTagListData[tpaNextStatus]?.secondClaimCountDetails || {}}
          totalSecondClaimCountData =  {totalFilterCount || {}}
          isCountClickedData = {isCountClicked}
        /> : groupProviders?.length > 0 ? <></> :  <InpatientListSubFilters
        inPatientTableMapping={inPatientTableMapping}
        onColumnEditSave={onColumnEditSave}
        buttonType={resetBtnType}
        setLoaderStateValue={setLoaderStateValue}
        autoCompleteRef={autoCompleteRef}
        searchForm={searchForm}
        isRefreshLoading={isCountLoading}
        reloadTagCount={reloadTagCount}
        resetFilter={resetFilter}
        secondaryFilterData={tpaTagListData[tpaNextStatus]?.secondClaimCountDetails || {}}
        totalSecondClaimCountData =  {totalFilterCount || {}}
        isCountClickedData = {isCountClicked}
      />
      }

      <Form
        form={claimForm}
      >
        <Table
          data-testid="in-patient-list"
          size={TABLE_SIZE_MIDDLE}
          columns={
            isDraftBtnClicked
              ? draftColumns : inPatientColumns
          }
          dataSource={
            isDraftBtnClicked
              ? draftData : inPatientData
          }
          pagination={false}
          onRow={(record: any, rowIndex: any): any => {
            return {
              onClick: (event: any, e: any): any => { !updateCourierDetailClicked ?
                rowClick(event, record, rowIndex) : selectedClickHandler(record); },
            };
          }}
          locale={{
            emptyText: (
              isTblLoading ?
                <div className="full-skelton-in-list">
                  {blankArr.map((...params: any[]): any =>
                    <Skeleton
                      key={params[1]}
                      active={true}
                      paragraph={{ rows: 0 }}
                    />,
                  )}
                </div>
                : <Empty />
            ),
          }}
          onChange={isDraftBtnClicked ? handleTableChangeDraft : handleTableChange}
        />
      </Form>
      {(inPatientDataCount > 0 || draftDataCount > 0) && <Pagination
        data-testid="pagination"
        showSizeChanger={false}
        onChange={pageChange}
        defaultCurrent={1}
        current={pageIndex}
        total={isDraftBtnClicked ? draftDataCount : inPatientDataCount}
        className="mt-md text-center"
      />}

    <TrackCourierModal
      isShowTrackCourierModal={isShowTrackCourierModal}
      setIsShowTrackCourierModal={setIsShowTrackCourierModal}
      trackCourierForm={trackCourierForm}
      trackCourierFormSubmitHandler={trackCourierFormSubmitHandler}
    />
    </div>
  </>;
};

export default List;