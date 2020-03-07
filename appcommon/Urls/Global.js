
class Global {

    // static BASE_PATH = 'http://192.168.43.147';
    static BASE_PATH = 'https:bringmyfood.tk';

    static SET_PAYMENT_MODE = '/data/reactapp/delivery/set-order-payment-mode.php';
    static SET_DELIVERY_ORDER_ACCEPTANCE = '/data/reactapp/delivery/set-delivery-order-acceptance.php';

    static GET_ORDER_DETAILS = '/data/reactapp/delivery/get-order-details.php';
    static GET_BILLING_ORDER_DETAILS = '/data/reactapp/delivery/get-billing-order-details.php'
    static GET_ONGOING_DELIVERY_ORDERS = '/data/reactapp/delivery/get-ongoing-delivery-orders.php';
    static GET_DELIVERY_ORDER_NOTIFICATION = '/data/reactapp/delivery/get-delivery-order-notification.php';
    static GET_DELIVERY_ORDER_HISTORY = '/data/reactapp/delivery/get-delivery-order-history-v1.php';
    static COLLECT_ORDER_FROM_RESTAURANT = '/data/reactapp/delivery/collect-order-from-restaurant.php';
    static REJECT_ORDER = '/data/reactapp/delivery/reject-order.php';

    static CHECK_DELIVERY_LOGIN = '/data/reactapp/delivery/rncheckdeliverylogin.php';
    static DELIVERY_ORDER_ACTION = '/data/reactapp/delivery/delivery-order-action.php';
    static ORDER_NET_PAYABLE_AMOUNT = '/data/reactapp/delivery/get-order-net-payable-amount.php';
    static LEAVE_APPLY_URL = '/data/reactapp/delivery/apply-leave.php';
    static CHAGE_DELIVERY_PERSON_DUTY_STATUS = '/data/reactapp/delivery/change-delivery-person-duty-status.php';
    static UPDATE_DELIVERY_PERSON_LIVE_LOCATION = '/data/reactapp/delivery/update-delivery-person-current-location.php';
}

export default Global;

